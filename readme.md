# Assistente IA Web - Extensão de Automação

Uma extensão de navegador que permite automatizar tarefas web usando inteligência artificial. Perfeita para usuários leigos que querem automatizar tarefas repetitivas como postagens em redes sociais, consultas de preços, batida de ponto, etc.

## 🚀 Funcionalidades

- **Onboarding Completo**: Guia passo-a-passo para configuração
- **Múltiplos Provedores de IA**: OpenAI, Google Gemini, Ollama
- **Interface Amigável**: Projetada para usuários não-técnicos
- **Automação Inteligente**: Controle completo do navegador via IA
- **Execução Visual**: Acompanhe cada passo da automação

## 🛠️ Como Usar

### 1. Instalação
1. Execute `npm run build-extension` para gerar os arquivos da extensão
2. Abra o Chrome e vá para `chrome://extensions/`
3. Ative o "Modo do desenvolvedor"
4. Clique em "Carregar sem compactação" e selecione a pasta `dist`

### 2. Configuração
1. Clique no ícone da extensão
2. Siga o onboarding para escolher seu provedor de IA
3. Configure sua chave de API
4. Teste a conexão

### 3. Uso
1. Clique no ícone da extensão
2. Digite uma instrução como "Faça uma postagem de bom dia no LinkedIn"
3. Acompanhe a execução automática

## 🤖 Provedores Suportados

### OpenAI (ChatGPT)
- **Custo**: ~R$ 0,10 por 100 tarefas simples
- **Ideal para**: Usuários que querem máxima confiabilidade
- **Como obter**: https://platform.openai.com/api-keys

### Google Gemini
- **Custo**: Gratuito até 60 requisições/minuto
- **Ideal para**: Iniciantes que querem testar
- **Como obter**: https://makersuite.google.com/app/apikey

### Ollama (Local)
- **Custo**: Completamente gratuito
- **Ideal para**: Usuários que querem privacidade total
- **Como obter**: https://ollama.ai/download

## 📝 Exemplos de Uso

- "Abra o Gmail e verifique novos emails"
- "Faça uma postagem no LinkedIn sobre produtividade"
- "Consulte o preço de passagens para São Paulo"
- "Bata meu ponto no sistema da empresa"
- "Pesquise por apartamentos para alugar"

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build para extensão
npm run build-extension
```

## 🎯 Arquitetura

- **Popup**: Interface principal da extensão
- **Options**: Página de configurações detalhadas
- **Content Script**: Executa ações nas páginas web
- **Background**: Gerencia comunicação e estado
- **AI Service**: Integração com provedores de IA

## 🔒 Segurança

- Chaves de API armazenadas localmente
- Comunicação segura com provedores
- Execução controlada e monitorada
- Sem coleta de dados pessoais

## 📱 Interface

A extensão foi projetada com foco na usabilidade para usuários leigos:

- **Onboarding Visual**: Guias passo-a-passo com ícones e explicações
- **Configuração Simples**: Links diretos para obter chaves de API
- **Feedback Visual**: Acompanhe cada ação sendo executada
- **Controles Intuitivos**: Play, pause e stop para execução
- **Exemplos Práticos**: Sugestões de tarefas comuns

## 🚨 Limitações

- Funciona apenas em sites públicos
- Alguns sites podem ter proteções anti-automação
- Requer chave de API de provedor de IA
- Execução pode variar dependendo da estrutura do site

## 🤝 Contribuição

Esta extensão foi criada para democratizar a automação web, tornando-a acessível para usuários não-técnicos. Contribuições são bem-vindas!