# Deploy & Requisitos — Licenciamento

Este documento descreve os requisitos e passos mínimos para colocar a aplicação de frontend "Licenciamento" em produção.

## Resumo
- Aplicação: SPA React + Vite (gerate `dist/` no build)
- Backend: API separada (fornecer URL da API)
- Objetivo: servir `dist/` via Nginx (HTTPS) + reverse-proxy para API

---

## 1) Requisitos do servidor
- SO: Ubuntu 22.04 LTS (ou outra distro Linux estável)
- Utilizadores: conta não-root para deploy (ex: `deploy`)
- Pacotes mínimos:
  - `git`
  - `nodejs` 18.x (para build) e `npm` ou `pnpm`
  - `nginx`
  - `certbot` (Let's Encrypt) para TLS
- Firewall: permitir 80/443 (HTTP/HTTPS), fechar portas desnecessárias

---

## 2) Domínio e TLS
- Registar domínio e apontar `A` record para o IP do servidor.
- Obter TLS com Let's Encrypt (Certbot) ou certificado do provedor.
  Exemplo (Certbot nginx):

```bash
sudo apt update && sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

## 3) Variáveis de ambiente (frontend)
- O Vite injeta variáveis em build time. Definir antes do `npm run build`:
  - `VITE_API_BASE_URL` — URL base da API (ex: `https://api.seudominio.com`)

Exemplo `.env.production`:
```
VITE_API_BASE_URL=https://api.seudominio.com
```

> Atenção: editar o ficheiro `src/config/env.ts` se o projeto usar outro método de configuração.

---

## 4) Build & Deploy (passos mínimos)
1. Clonar repositório:
```bash
git clone <repo-url> licenciamento
cd licenciamento
```
2. Instalar dependências (no servidor ou CI):
```bash
npm ci
```
3. Ajustar `VITE_API_BASE_URL` (ver ponto 3) — exportar variável ou copiar `.env.production`.
4. Fazer build:
```bash
npm run build
```
5. Sincronizar `dist/` para o diretório servido pelo nginx (ex: `/var/www/licenciamento`):
```bash
sudo mkdir -p /var/www/licenciamento
sudo chown $USER:$USER /var/www/licenciamento
rsync -av --delete dist/ /var/www/licenciamento/
```
6. Configurar Nginx (ver exemplo abaixo) e recarregar:
```bash
sudo systemctl reload nginx
```

---

## 5) Exemplo de configuração Nginx (mínima)
Substitua `seu-dominio.com` e `api.seudominio.com` pelos valores reais.

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    root /var/www/licenciamento;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API
    location /api/ {
        proxy_pass https://api.seudominio.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Segurança básica
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "no-referrer-when-downgrade";
}
```

Após obter o certificado com Certbot, o bloco HTTPS será gerado automaticamente ou pode ser ajustado.

---

## 6) CORS e API
- A API tem de permitir requests da origem do frontend (`https://seu-dominio.com`).
- Métodos necessários: `POST`, `GET`, `OPTIONS`.
- Headers permitidos: `Content-Type`, `Authorization`, `Accept`.

---

## 7) Autenticação / Tokens
- O frontend guarda `auth_token` no `localStorage` e envia `Authorization: Bearer <token>` via `apiClient`.
- Garantir que o backend aceita Bearer tokens nas rotas protegidas.

---

## 8) MIME / Downloads
- O frontend gera `.lic` localmente; se o backend devolver ficheiros, garantir `Content-Disposition` e `Content-Type` adequados (ex: `application/octet-stream`).

---

## 9) Testes pós-deploy (smoke tests)
- Login com utilizador de teste.
- Buscar licença (CheckLic) com um código de teste.
- Selecionar produtos e gravar (Generate) — verificar 200.
- Fazer download do ficheiro `.lic` e verificar conteúdo.
- Verificar consola do browser e rede para erros CORS/405/400.

---

## 10) CI/CD (recomendado)
- Pipeline sugerido:
  1. `checkout`
  2. `npm ci`
  3. `npx tsc --noEmit` (type check)
  4. `npm run build`
  5. `rsync` ou `scp` para servidor, ou publicar em object storage + CDN
- Opcional: usar GitHub Actions / GitLab CI / Azure DevOps.

---

## 11) Monitorização / Segurança
- Logs Nginx (access/error) + backend logs.
- Adicionar headers de segurança e HSTS.
- Opcional: Sentry para erros JS, Prometheus/Grafana para métricas.

---

## 12) Checklist a enviar à equipa de infra
- Acesso SSH ao servidor (utilizador de deploy)
- IP público e dominio
- Valores das variáveis `VITE_API_BASE_URL`
- Branch/repo a deployar
- Contactos para testes e aprovação

---

## 13) Exemplos de comandos rápidos
```bash
# no servidor
git clone <repo-url>
cd licenciamento
npm ci
export VITE_API_BASE_URL=https://api.seudominio.com
npm run build
rsync -av --delete dist/ /var/www/licenciamento/
sudo systemctl reload nginx
```

---

## Contactos e próximos passos
- Se quiser, posso gerar:
  - um `nginx` config completo pronto a usar;
  - um script de deploy (`deploy.sh`) com `rsync`;
  - um template `.env.production`.

---

Documento gerado por assistência automática. Ajustar caminhos de acordo com a política/estrutura da infra.
