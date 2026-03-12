import { PageHeader } from "@/components/PageHeader";

const ProdutoPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Produto" description="Licenciamento" />

      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-muted-foreground mb-4">
          Em Desenvolvimento
        </h2>
        <p className="text-muted-foreground">
          Esta funcionalidade estará disponível em breve.
        </p>
      </div>
    </div>
  );
};

export default ProdutoPage;