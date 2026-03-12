# Checklist de Preparação do Servidor (Windows)

Este documento lista apenas o que a equipa de servidores precisa de preparar num servidor Windows para hospedar a aplicação frontend "Licenciamento" (não inclui passos de desenvolvimento, build ou deploy).

- Sistema operativo
  - Windows Server 2019 ou 2022 (actualizado com patches de segurança).
  - Definir horário NTP (sincronização de tempo).

- Conta e permissões
  - Conta de serviço / utilizador de deploy (ex: `deploy`) com acesso ao directório onde os ficheiros estáticos vão ser colocados.
  - Permissões NTFS: conceder apenas o necessário ao utilizador de deploy (write no directório de deploy, leitura para o IIS ApplicationPool identity).

- IIS (Internet Information Services)
  - Instalar role IIS com módulos: `Static Content`, `URL Rewrite` e `WebSocket` (se necessário).
  - Instalar Application Request Routing (ARR) para permitir reverse-proxy (se o backend estiver noutro servidor).
  - Habilitar compressão (`Dynamic` e `Static`) e caching estático.
  - Criar site com `Physical Path` (por exemplo `C:\inetpub\wwwroot\licenciamento`) e App Pool dedicado.
  - Configurar `Default Document` para `index.html` e fallback rule (URL Rewrite) para SPA (redirecionar para `index.html` em 404s de rota do cliente).

- Reverse proxy / API
  - Configurar regra de reverse-proxy (ARR) para encaminhar chamadas do prefixo `/api/` para o backend (ex: `https://api.seudominio.com`).
  - Garantir que os cabeçalhos `X-Forwarded-For` e `X-Forwarded-Proto` são preservados.

- TLS / Certificados
  - Obter certificados TLS para o domínio (recomendado: `win-acme` para Let's Encrypt em Windows).
  - Instalar e bindar o certificado ao site no IIS para porta 443.
  - Habilitar HTTP->HTTPS redirecionamento.

- Firewall e portas
  - Abrir porta 80 e 443 (TCP) no firewall do Windows e no firewall da rede/host.

- MIME types e downloads
  - Adicionar mapeamento MIME se necessário para extensões específicas (ex.: `.lic` → `application/octet-stream`) — embora o `.lic` seja normalmente tratado por download, configurar se necessário.

- Segurança (IIS/web.config)
  - Definir headers de segurança via `web.config` ou configurações IIS:
    - `Strict-Transport-Security` (HSTS)
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy`
    - `Content-Security-Policy` (básico)
  - Configurar limites de request size e request filtering conforme políticas da organização.

- CORS e comunicação com a API
  - Confirmar com equipa de backend que a API permite `Origin` do frontend (`https://seu-dominio`) e métodos `GET, POST, OPTIONS` e cabeçalhos `Authorization, Content-Type`.

- Logging e monitorização
  - Habilitar logs de acesso e erro do IIS (retention/rotação conforme política).
  - Configurar alertas/monitorização (uptime, erro 5xx, alta latência).

- Backups e rollback
  - Plano de backup do directório do site (ou preservar releases anteriores para rollback rápido).

- Sistema de permissões e contas
  - Não usar contas com privilégios elevados para processos da web (App Pool identity dedicada).
  - Acesso SSH/Remote Desktop restrito e documentado para equipa de infra.

- Antivirus e restrições
  - Configurar excepções no AV para o directório do site se o AV interferir com ficheiros estáticos ou logs.

- Health checks / Endpoints
  - Criar endpoint de smell/health para o frontend (ex: `https://seu-dominio/health`) se desejado, ou confirmar monitorização baseada em HTTP 200 da página inicial.

- Documentação a fornecer à infra (para preparação)
  - Domínio(s) e IP(s) públicos a usar.
  - Nome do site para bind no IIS (host header).
  - Certificado TLS (ou método automático com win-acme).
  - Endereço do backend API aonde o reverse-proxy deve apontar.
  - Contactos para testes e validação.


> Observação: o frontend é um SPA construído com Vite e produz um conjunto de ficheiros estáticos (`dist/`). A equipa de servidores só precisa de preparar o ambiente para servir esses ficheiros e assegurar o proxy para a API; o build (gerar `dist/`) e o conteúdo a copiar para o servidor são responsabilidade da equipa de desenvolvimento/desdobramento.
