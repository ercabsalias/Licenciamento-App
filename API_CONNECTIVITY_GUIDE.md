# 🔧 Resolução de Problemas de Conectividade API

## Problema: "Erro de conexão. Verifique se a API está rodando e acessível."

Este erro geralmente ocorre devido a problemas de CORS, HTTPS ou configuração da API.

## ✅ Soluções Implementadas

### 1. **Mudança para HTTP (Desenvolvimento)**
- A aplicação agora usa `http://localhost:7263` ao invés de `https://localhost:7263`
- Isso evita problemas de certificado SSL em desenvolvimento

### 2. **Botão de Teste de Conexão**
- Adicionado botão "🔍 Testar Conexão API" na tela de login
- Permite testar a conectividade antes de tentar fazer login

## 🔍 Verificações Necessárias

### **Na sua API (.NET):**

#### 1. **Habilitar CORS**
Adicione no `Program.cs` ou `Startup.cs`:

```csharp
// Para desenvolvimento - permitir qualquer origem
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

app.UseCors("AllowAll");
```

#### 2. **Verificar Endpoint**
Certifique-se que o endpoint `/Users/Login` existe e aceita POST requests.

#### 3. **Headers de Resposta**
A API deve incluir headers CORS:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### **No Frontend:**

#### 1. **Verificar URL da API**
No arquivo `.env.local`:
```
VITE_API_BASE_URL=http://localhost:7263
```

#### 2. **Testar Conectividade**
1. Abra a aplicação em http://localhost:8089
2. Clique no botão "🔍 Testar Conexão API"
3. Verifique a resposta no campo de erro

## 🚀 Teste Passo-a-Passo

1. **Certifique-se que sua API está rodando** em `http://localhost:7263`
2. **Abra** http://localhost:8089 no navegador
3. **Clique** em "🔍 Testar Conexão API"
4. **Verifique** se aparece "✅ Conexão com API bem-sucedida!"
5. **Se der erro**, verifique os logs no console do navegador (F12)

## 🔧 Configurações Alternativas

### **Se preferir manter HTTPS:**

1. **Configure um certificado válido** para localhost
2. **Ou use** `VITE_API_BASE_URL=https://localhost:7263` no `.env.local`
3. **Certifique-se** que o navegador aceita o certificado auto-assinado

### **Para produção:**
- Configure CORS adequadamente (não use `*`)
- Use HTTPS com certificado válido
- Configure as origens permitidas

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs do console do navegador (F12 → Console)
2. Verifique os logs da sua API
3. Teste o endpoint diretamente: `curl -X POST http://localhost:7263/Users/Login`