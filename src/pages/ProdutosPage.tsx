import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Search, Download, Save, Package, Monitor, User } from "lucide-react";
import { toast } from "sonner";

// hooks para chamadas reais
import { useProdutos, useCheckLic, useGenerateLic } from "@/services/api/hooks";
import { apiClient } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { Licenca, LinhaProduto, GenerateRequest, GenerateProduto } from "@/services/mockData"; // licenciatura ainda usa interface mock

const ProdutosPage = () => {
  const [codigoCliente, setCodigoCliente] = useState("");
  const [licenca, setLicenca] = useState<Licenca | null>(null); // licenca.id may be set later
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchProdutos, setSearchProdutos] = useState("");
  const itemsPerPage = 10;

  const formatDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('pt-PT');
  };

  // referências de hook para produtos e salvar
  const { data: produtos, isLoading: produtosLoading } = useProdutos();
  const checkLicMutation = useCheckLic();
  const generateLicMutation = useGenerateLic();

  // não mostramos mais códigos de exemplo; a API já carrega produtos e cada cliente digita o seu código.
  // pode-se substituir por dicas ou documentação conforme necessário.

  // quando a lista de produtos chegar e ainda não tivermos licença inicial,
  // geramos um objecto vazio com todas as linhas marcadas
  useEffect(() => {
    if (produtos && produtos.length && !licenca) {
      const linhas: LinhaProduto[] = produtos.map((p) => ({
        id: p.id,
        produto: p.codigoProduto,
        descricao: p.descricao,
        dataInicio: "",
        dataFinal: "",
        activo: false,
        selected: false,
      }));
      setLicenca({
        // generate a temporary GUID now so we never send an empty string later
        id: crypto.randomUUID(),
        cliente: {
          codigo: "",
          codigoLic: "",
          nome: "",
          numeroContribuinte: "",
          codigoERP: "",
          jsonLic: "",
          macAddress: "",
          activo: false,
        },
        linhasProdutos: linhas,
        macAddresses: [],
      });
      setCurrentPage(1);
    }
  }, [produtos, licenca]);

  const handleSearch = async () => {
    if (!codigoCliente.trim()) {
      toast.error("Por favor, insira um código de cliente");
      return;
    }
    setLoading(true);
    try {
      const result = await checkLicMutation.mutateAsync(codigoCliente.trim());
      
      if (result && result.licEnt) {
        // Sincronizar informações do cliente
        const clientInfo = {
          id: result.licEnt.id,
          codigo: result.licEnt.codigo,
          codigoLic: result.licEnt.codLic,
          nome: result.licEnt.nome,
          numeroContribuinte: result.licEnt.nif,
          codigoERP: result.licEnt.codigoErp,
          jsonLic: result.licEnt.jsonLic ?? '',
          macAddress: result.licEnt.macAddress ?? '',
          activo: result.licEnt.activo,
        };

        // Sincronizar MACs mantendo o id
        const macAddresses = result.macs.map(m => ({ id: m.id, macAddress: m.macAddress }));

        // Sincronizar produtos: usar id de relação, marcar activos conforme resposta
        // e sincronizar datas de validade (dataInicio/dataFinal)
        const updatedLinhas = licenca?.linhasProdutos.map(linha => {
          const produtoNaLicenca = result.produtos.find(p => p.codProduto === linha.produto);
          const isActivo = produtoNaLicenca?.activo ?? false;
          return {
            ...linha,
            id: produtoNaLicenca?.id || linha.id,
            selected: isActivo,
            activo: isActivo,
            dataInicio: produtoNaLicenca?.validadeDe ?? linha.dataInicio,
            dataFinal: produtoNaLicenca?.validadeAte ?? linha.dataFinal,
          };
        }) || [];

        setLicenca({
          id: result.licEnt.id,
          cliente: clientInfo,
          linhasProdutos: updatedLinhas,
          macAddresses,
        });
        setCurrentPage(1);
        toast.success("Licença encontrada e produtos sincronizados");
      } else {
        // Se não existir licença, preencher os campos Código e Código Lic conforme solicitado
        const codigo = codigoCliente.trim();
        // preencher apenas Código e Código Lic; manter a listagem de produtos disponíveis
        const linhas: LinhaProduto[] = produtos?.map((p) => ({
          id: p.id,
          produto: p.codigoProduto,
          descricao: p.descricao,
          dataInicio: "",
          dataFinal: "",
          activo: false,
          selected: false,
        })) || [];

        setLicenca({
          id: crypto.randomUUID(),
          cliente: {
            codigo,
            codigoLic: `${codigo}.1`,
            nome: "",
            numeroContribuinte: "",
            codigoERP: "",
            jsonLic: "",
            macAddress: "",
            activo: false,
          },
          linhasProdutos: linhas,
          macAddresses: [],
        });
        setCurrentPage(1);
        toast.error("Licença não encontrada — pré-preenchido Código e Código Lic (pode gravar)");
      }
    } catch (error: any) {
      console.error("checkLic error", error);
      const msg = error?.message || "Erro ao buscar licença";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!licenca) return;
    setSaving(true);
    try {
      // montar payload conforme swagger /Generate/Generate
      // prepare the list of selected products / license lines; the server
      // expects this array in the required property `licencas` (the previous
      // name `produtos` was coming from an outdated swagger sample).  we send
      // it twice for backwards compatibility but the backend will only look at
      // `licencas`.
      const selectedItems: GenerateProduto[] = licenca.linhasProdutos
        .filter((l) => l.selected)
        .map((l) => ({
          id: l.id,
          idLicEnt: licenca.id || undefined,
          codProduto: l.produto,
          tipoSubscricao: 0,
          validadeDe: l.dataInicio || new Date().toISOString(),
          validadeAte: l.dataFinal || new Date().toISOString(),
          activo: l.activo,
          funcionalidades: [],
        }));

      // build payload; omit `id` when it's falsy so the server does not attempt
      // to parse an empty string to a Guid (that was triggering the
      // "could not be converted to System.Guid" error).
      const licEntPayload: any = {
        codLic: licenca.cliente.codigoLic,
        codigo: licenca.cliente.codigo,
        codigoErp: licenca.cliente.codigoERP,
        nome: licenca.cliente.nome,
        nif: licenca.cliente.numeroContribuinte,
        jsonLic: licenca.cliente.jsonLic || '',
        macAddress: licenca.cliente.macAddress || '',
        activo: licenca.cliente.activo ?? true,
      };
      if (licenca.id) licEntPayload.id = licenca.id;

      const payload: GenerateRequest = {
        licEnt: licEntPayload,
        macs: (licenca.macAddresses || []).map((m) => ({
          id: m.id || '',
          codLic: licenca.cliente.codigoLic,
          macAddress: m.macAddress,
        })),
        licencas: selectedItems,
        // keep the old name as optional for legacy calls
        produtos: selectedItems,
      };
      console.log('generate payload', payload);

      await generateLicMutation.mutateAsync(payload);
      toast.success("Licença gerada/grava com sucesso");

      // Limpar todo o formulário após gravar
      setLicenca(null);
      setCodigoCliente("");
      setSearchProdutos("");
      setCurrentPage(1);
    } catch (error) {
      toast.error("Erro ao gravar licença");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadXml = async () => {
    if (!licenca) return;
    if (!licenca.cliente.codigoLic) {
      toast.error('Código Lic vazio. Busque ou preencha antes de baixar.');
      return;
    }

    try {
      setSaving(true);
      // Garantir que a licença está guardada antes de pedir o XML
      await handleSave();

      // Obter XML encriptado do servidor (API expects POST)
      const resp = await apiClient.post<string>(endpoints.generate.getLic(licenca.cliente.codigoLic), { body: '' });
      if (!resp.success || !resp.data) {
        throw new Error(resp.error?.message || 'Erro ao obter XML');
      }

      const xmlContent = resp.data as string;
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Construir nome do ficheiro: Openlimits.Licenciamento_<PrimeiroNome>.lic
      const customerNameRaw = licenca.cliente.nome || '';
      const firstName = (customerNameRaw.split(' ').filter(Boolean)[0]) || licenca.cliente.codigoLic || 'Client';
      // sanitizar para evitar caracteres inválidos em nomes de ficheiro
      const safeName = firstName.replace(/[^a-zA-Z0-9-_]/g, '');
      a.download = `Openlimits.Licenciamento_${safeName}.lic`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Download iniciado (.lic)');
    } catch (error: any) {
      console.error('GetLic error', error);
      toast.error(error?.message || 'Erro ao baixar XML');
    } finally {
      setSaving(false);
    }
  };

  const toggleLinhaProdutoSelection = (id: string) => {
    if (!licenca) return;
    const updatedLinhas = licenca.linhasProdutos.map(linha =>
      linha.id === id ? { ...linha, selected: !linha.selected, activo: !linha.selected } : linha
    );
    setLicenca({ ...licenca, linhasProdutos: updatedLinhas });
  };

  const toggleLinhaProdutoActivo = (id: string) => {
    if (!licenca) return;
    const updatedLinhas = licenca.linhasProdutos.map(linha =>
      linha.id === id ? { ...linha, activo: !linha.activo } : linha
    );
    setLicenca({ ...licenca, linhasProdutos: updatedLinhas });
  };

  const addMacAddress = () => {
    if (!licenca) return;
    setLicenca({
      ...licenca,
      macAddresses: [...(licenca.macAddresses || []), { id: '', macAddress: '' }]
    });
  };

  const updateMacAddress = (index: number, value: string) => {
    if (!licenca) return;
    const newMacs = [...(licenca.macAddresses || [])];
    newMacs[index] = { ...newMacs[index], macAddress: value };
    setLicenca({
      ...licenca,
      macAddresses: newMacs
    });
  };

  const removeMacAddress = (index: number) => {
    if (!licenca) return;
    const newMacs = (licenca.macAddresses || []).filter((_, i) => i !== index);
    setLicenca({
      ...licenca,
      macAddresses: newMacs
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Licenciamento"
        description="Gerenciar licenças de produtos e endereços MAC"
      />

      {/* Instruções gerais - removido para economizar espaço */}

      {/* Search Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Licença
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="codigoCliente" className="text-sm font-medium">
                Código do Cliente
              </Label>
              <Input
                id="codigoCliente"
                value={codigoCliente}
                onChange={(e) => setCodigoCliente(e.target.value)}
                placeholder="Digite o código do cliente (ex: 69893)"
                className="mt-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} size="lg">
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* sempre mostramos o formulário; a licença só poderá estar vazia enquanto aguardamos os produtos */}
      <>
        {/* Client Data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
            <CardDescription>
              Informações do cliente associado à licença (pode editar ou gravar nova)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="codigo" className="text-sm font-medium">
                  Código
                </Label>
                <Input
                  id="codigo"
                  value={licenca?.cliente.codigo || ''}
                  onChange={(e) => {
                    if (licenca)
                      setLicenca({
                        ...licenca,
                        cliente: { ...licenca.cliente, codigo: e.target.value },
                      });
                  }}
                  className="transition-colors focus:ring-2"
                />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoLicCliente" className="text-sm font-medium">
                    Código Lic
                  </Label>
                  <Input
                    id="codigoLicCliente"
                    value={licenca?.cliente.codigoLic || ''}
                    onChange={(e) => licenca && setLicenca({
                      ...licenca,
                      cliente: { ...licenca.cliente, codigoLic: e.target.value }
                    })}
                    className="transition-colors focus:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={licenca?.cliente.nome || ''}
                    onChange={(e) => licenca && setLicenca({
                      ...licenca,
                      cliente: { ...licenca.cliente, nome: e.target.value }
                    })}
                    className="transition-colors focus:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroContribuinte" className="text-sm font-medium">
                    Nº Contribuinte
                  </Label>
                  <Input
                    id="numeroContribuinte"
                    value={licenca?.cliente.numeroContribuinte || ''}
                    onChange={(e) => licenca && setLicenca({
                      ...licenca,
                      cliente: { ...licenca.cliente, numeroContribuinte: e.target.value }
                    })}
                    className="transition-colors focus:ring-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoERP" className="text-sm font-medium">
                    Código ERP
                  </Label>
                  <Input
                    id="codigoERP"
                    value={licenca?.cliente.codigoERP || ''}
                    onChange={(e) => licenca && setLicenca({
                      ...licenca,
                      cliente: { ...licenca.cliente, codigoERP: e.target.value }
                    })}
                    className="transition-colors focus:ring-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Products and MAC Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerenciamento da Licença</CardTitle>
              <CardDescription>
                Organize produtos e endereços MAC em seções separadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="produtos" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="produtos" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos ({licenca?.linhasProdutos.length ?? 0})
                  </TabsTrigger>
                  <TabsTrigger value="mac" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    MAC Addresses ({licenca?.macAddresses.length ?? 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="produtos" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Produtos</h3>
                        <p className="text-sm text-muted-foreground">
                          Lista de produtos associados à licença. Use o checkbox "Sel" para selecionar toda a linha.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Input
                        placeholder="Pesquisar produtos por código ou descrição..."
                        value={searchProdutos}
                        onChange={(e) => {
                          setSearchProdutos(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="mb-4"
                      />
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-12 font-semibold">Sel</TableHead>
                            <TableHead className="font-semibold">Produto</TableHead>
                            <TableHead className="font-semibold">Descrição</TableHead>
                            <TableHead className="font-semibold">Data Início</TableHead>
                            <TableHead className="font-semibold">Data Final</TableHead>
                            <TableHead className="w-20 font-semibold">Activo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const allLinhas = licenca?.linhasProdutos || [];
                            // Filtrar por search
                            const filteredLinhas = allLinhas.filter((linha) =>
                              linha.produto.toLowerCase().includes(searchProdutos.toLowerCase()) ||
                              linha.descricao.toLowerCase().includes(searchProdutos.toLowerCase())
                            );
                            const totalPages = Math.ceil(filteredLinhas.length / itemsPerPage);
                            const startIdx = (currentPage - 1) * itemsPerPage;
                            const endIdx = startIdx + itemsPerPage;
                            const paginatedItems = filteredLinhas.slice(startIdx, endIdx);
                            
                            return paginatedItems.map((linha) => (
                              <TableRow
                                key={linha.id}
                                className={`transition-colors hover:bg-muted/30 ${
                                  linha.selected ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                                }`}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={linha.selected}
                                    onCheckedChange={() => toggleLinhaProdutoSelection(linha.id)}
                                    className="transition-colors"
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{linha.produto}</TableCell>
                                <TableCell>{linha.descricao}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{formatDate(linha.dataInicio)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{formatDate(linha.dataFinal)}</TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={linha.activo}
                                    onCheckedChange={() => toggleLinhaProdutoActivo(linha.id)}
                                    className="transition-colors"
                                  />
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Paginação */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        {(() => {
                          const allLinhas = licenca?.linhasProdutos || [];
                          const filteredLinhas = allLinhas.filter((linha) =>
                            linha.produto.toLowerCase().includes(searchProdutos.toLowerCase()) ||
                            linha.descricao.toLowerCase().includes(searchProdutos.toLowerCase())
                          );
                          const totalPages = Math.ceil(filteredLinhas.length / itemsPerPage);
                          const startIdx = (currentPage - 1) * itemsPerPage + 1;
                          const endIdx = Math.min(currentPage * itemsPerPage, filteredLinhas.length);
                          return `${startIdx}-${endIdx} de ${filteredLinhas.length} produtos`;
                        })()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allLinhas = licenca?.linhasProdutos || [];
                            const filteredLinhas = allLinhas.filter((linha) =>
                              linha.produto.toLowerCase().includes(searchProdutos.toLowerCase()) ||
                              linha.descricao.toLowerCase().includes(searchProdutos.toLowerCase())
                            );
                            const totalPages = Math.ceil(filteredLinhas.length / itemsPerPage);
                            setCurrentPage(p => Math.min(totalPages, p + 1));
                          }}
                          disabled={(() => {
                            const allLinhas = licenca?.linhasProdutos || [];
                            const filteredLinhas = allLinhas.filter((linha) =>
                              linha.produto.toLowerCase().includes(searchProdutos.toLowerCase()) ||
                              linha.descricao.toLowerCase().includes(searchProdutos.toLowerCase())
                            );
                            const totalPages = Math.ceil(filteredLinhas.length / itemsPerPage);
                            return currentPage >= totalPages;
                          })()}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="mac" className="mt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Endereços MAC</h3>
                        <p className="text-sm text-muted-foreground">
                          Gerencie os endereços MAC associados à licença
                        </p>
                      </div>
                      <Button onClick={addMacAddress} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Adicionar MAC
                      </Button>
                    </div>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Endereço MAC</TableHead>
                            <TableHead className="w-20 font-semibold">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(licenca?.macAddresses || []).map((mac, index) => (
                            <TableRow key={index} className="hover:bg-muted/30 transition-colors">
                              <TableCell>
                                <Input
                                  value={mac.macAddress}
                                  onChange={(e) => updateMacAddress(index, e.target.value)}
                                  placeholder="00:00:00:00:00:00"
                                  className="border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-ring"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeMacAddress(index)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-end">
                <Button variant="outline" onClick={handleDownloadXml} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download 
                </Button>
                <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>

      {!licenca && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">
                {produtosLoading ? 'A carregar produtos...' : 'Nenhuma licença disponível'}
              </p>
              <p className="text-sm">
                {produtosLoading
                  ? 'aguarde enquanto a lista de produtos é recuperada'
                  : 'Use um código de cliente para buscar ou comece a preencher'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProdutosPage;