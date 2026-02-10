# 💰 Financial Control

<div align="center">

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![Platform](https://img.shields.io/badge/platform-Android-green.svg)
![Framework](https://img.shields.io/badge/Ionic-8.5.1-blue.svg)
![Angular](https://img.shields.io/badge/Angular-19.2.3-red.svg)
![License](https://img.shields.io/badge/license-MIT-orange.svg)

**Seu Gerenciador Financeiro Pessoal com Segurança Biométrica e Privacidade Total**

[📱 Features](#-features) • [🚀 Demo](#-screenshots) • [⚡ Quick Start](#-quick-start) • [📊 Technology](#-technology-stack) • [🔒 Security](#-security)

</div>

---

## 🎯 Por Que Escolher Financial Control?

Em um mundo onde suas informações financeiras são constantemente compartilhadas com servidores na nuvem, **Financial Control** oferece uma alternativa revolucionária:

- ✅ **Sem Assinaturas** - Instale uma vez, use para sempre
- ✅ **Segurança Biométrica** - Protegido por impressão digital ou reconhecimento facial
- ✅ **Relatórios Profissionais** - Exporte para PDF, Excel ou imagens
- ✅ **Alertas Inteligentes** - Nunca mais esqueça uma conta

---

## ✨ Features

### 📊 Dashboard Completo
Visualize sua saúde financeira em um único lugar:
- **Resumo Mensal** - Receitas, despesas e saldo em cards informativos
- **Gráficos Interativos** - Compare receitas vs despesas visualmente
- **Gastos por Categoria** - Pizza chart com suas 8 principais categorias
- **Transações Recentes** - Últimas 5 movimentações
- **Contas a Vencer** - Próximos 7 dias de contas fixas

### 💳 Gestão de Transações
Controle total sobre suas finanças:
- ➕ **Adicionar/Editar/Excluir** transações com facilidade
- 🏷️ **13 Categorias Predefinidas** (Alimentação, Transporte, Moradia, etc.)
- 🔍 **Filtros Avançados** por tipo, categoria ou descrição
- 📝 **Notas e Tags** para organização personalizada
- 👆 **Gestos de Swipe** para edição/exclusão rápida

### 🔔 Despesas Fixas (Contas Recorrentes)
Nunca mais esqueça uma conta:
- 📅 **Configuração de Vencimento** - Defina o dia de pagamento
- 🔄 **Gerenciamento de Recorrência** - Contas mensais automáticas
- ✅ **Histórico de Pagamentos** - Rastreie quais meses foram pagos
- 🔕 **Ativar/Desativar** contas temporariamente
- 📱 **Notificações Configuráveis** - Alertas N dias antes do vencimento

### 📈 Relatórios e Analytics
Entenda seus padrões financeiros:
- 📊 **Comparação Mensal** - Mês atual vs mês anterior com percentuais
- 📅 **Relatório Anual** - Visão de 12 meses com tendências
- 🎯 **Análise por Categoria** - Detalhamento completo de gastos
- 📉 **Cálculo de Tendências** - Identifique se está gastando mais ou menos
- 💡 **Projeções Automáticas** - Estime gastos futuros baseado em padrões

### 📤 Exportação Profissional
Compartilhe e arquive seus dados:
- **PDF** - Relatórios formatados com tabelas e resumos
- **CSV** - Importe para Excel, Google Sheets ou sistemas de contabilidade
- **PNG** - Exporte gráficos como imagens
- **Compartilhamento Nativo** - Envie por e-mail, WhatsApp ou drive

---

## 📱 Screenshots

<div align="center">

| Dashboard | Transações | Despesas Fixas | Relatórios |
|-----------|------------|----------------|------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Transactions](docs/screenshots/transactions.png) | ![Fixed Expenses](docs/screenshots/fixed-expenses.png) | ![Reports](docs/screenshots/reports.png) |

</div>

---

## 🚀 Quick Start

### Pré-requisitos
```bash
Node.js >= 20.17.0
npm >= 10.8.2
Android Studio (para build Android)
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/financial-control.git

# Entre na pasta
cd financial-control

# Instale as dependências
npm install

# Execute no navegador (desenvolvimento)
ionic serve

# Ou execute no dispositivo Android
npm run start:android
```

### Build para Produção

```bash
# Build web otimizado
npm run build:prd

# Sincronize com Android
npx cap sync

# Abra no Android Studio
npm run open:android
```

---

## 🛠️ Technology Stack

### Core Framework
- **Angular 19.2.3** - Framework UI com standalone components
- **Ionic 8.5.1** - Componentes mobile e bridge nativo
- **Capacitor 7.1.0** - Acesso a recursos nativos do dispositivo
- **TypeScript 5.8.2** - Desenvolvimento type-safe
- **RxJS 7.8.2** - Programação reativa para gerenciamento de estado

### UI & Design
- **Angular Material 19.2.6** - Componentes Material Design
- **Ionicons 7.4.0** - Biblioteca de ícones (260+ ícones)
- **Chart.js 4.4.8** - Visualização de dados interativa
- **SCSS** - Estilização com tema dark de alto contraste

### Persistência de Dados
- **Ionic Storage Angular 4.0.0** - Wrapper do IndexedDB
- **IndexedDB** - Banco de dados local offline-first
  - Collection: `categories` - Categorias de transação
  - Collection: `transactions` - Registros de transações
  - Collection: `fixed-expenses` - Contas recorrentes

### Integrações Nativas (Capacitor Plugins)
- **capacitor-native-biometric** - Autenticação por impressão digital/Face ID
- **@capacitor/local-notifications** - Notificações push para vencimentos
- **@capacitor/filesystem** - Acesso ao sistema de arquivos para exports
- **@capacitor/share** - Dialog de compartilhamento nativo
- **@capacitor/device** - Informações do dispositivo
- **@capacitor/network** - Detecção de status de rede
- **@capacitor/preferences** - Armazenamento seguro de chave-valor

### Exportação & Documentos
- **jsPDF 3.0.3** - Geração de PDF
- **jspdf-autotable 5.0.2** - Renderização de tabelas em PDF
- **html2canvas 1.4.1** - Conversão de DOM para imagem

### Utilities
- **Moment.js 2.30.1** - Manipulação de datas (locale PT-BR)
- **Lodash 4.17.21** - Funções utilitárias para transformação de dados
- **UUID 11.1.0** - Geração de IDs únicos
- **Maskito 3.5.0** - Máscaras para input de moeda/datas

---

## 🏗️ Arquitetura do Projeto

```
financial-control/
├── src/
│   ├── app/
│   │   ├── pages/              # 5 páginas principais
│   │   │   ├── dashboard/      # Visão geral financeira
│   │   │   ├── transactions/   # Gestão de transações
│   │   │   ├── fixed-expenses/ # Contas recorrentes
│   │   │   ├── reports/        # Relatórios e analytics
│   │   │   └── home/           # Shell com tabs
│   │   │
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── app.routes.ts       # Navegação baseada em tabs
│   │   └── app.component.ts    # Componente raiz
│   │
│   ├── services/               # Camada de lógica de negócio
│   │   ├── transaction.service.ts      # CRUD de transações
│   │   ├── fixed-expense.service.ts    # Gerenciamento de contas fixas
│   │   ├── report.service.ts           # Geração de relatórios
│   │   ├── export.service.ts           # Exportação PDF/CSV/PNG
│   │   ├── notification.service.ts     # Notificações locais
│   │   └── category.service.ts         # Gestão de categorias
│   │
│   ├── models/                 # Interfaces TypeScript
│   │   ├── transaction.model.ts
│   │   ├── fixed-expense.model.ts
│   │   ├── category.model.ts
│   │   └── financial-summary.model.ts
│   │
│   ├── guards/                 # Proteção de rotas
│   │   └── auth.guard.ts       # Guarda de autenticação biométrica
│   │
│   ├── theme/                  # Sistema de estilização
│   │   ├── app-theme.scss      # Tema dark com alto contraste
│   │   └── variables.scss      # Variáveis de tema
│   │
│   └── utils/                  # Utilitários
│       ├── images.json         # Assets de imagens
│       └── storage-keys.ts     # Enums de chaves de armazenamento
│
├── android/                    # Projeto nativo Android
├── www/                        # Assets web buildados
└── capacitor.config.ts         # Configuração do Capacitor
```

---

## 🔒 Security

### Autenticação Biométrica
- **Impressão Digital/Face ID** - Acesso protegido com biometria nativa
- **Guard-based Protection** - Todas as rotas protegidas por AuthGuard
- **Fallback para PIN** - Opção de PIN se biometria indisponível
- **Apenas em Dispositivos** - Desabilitado no navegador para desenvolvimento

### Privacidade de Dados
- **Armazenamento Local** - Todos os dados permanecem no dispositivo
- **Zero Transmissão** - Nenhuma comunicação com servidores externos
- **Sem Rastreamento** - Nenhuma análise, cookies ou tracking
- **Sem Anúncios** - Interface limpa sem publicidade
- **Open Source** - Código auditável e transparente

### Criptografia Pronta
- **IndexedDB Seguro** - Pode ser criptografado com Capacitor Preferences
- **Sem Dados Sensíveis** - Não armazena cartões de crédito ou CPF

---

## 📊 Modelos de Dados

### Transaction (Transação)
```typescript
interface Transaction {
  id: string;                    // UUID único
  type: 'income' | 'expense';    // Tipo: receita ou despesa
  amount: number;                // Valor em moeda
  categoryId: string;            // Referência à categoria
  category?: Category;           // Objeto de categoria populado
  description: string;           // Descrição do usuário
  date: Date | string;           // Data da transação
  isRecurring: boolean;          // Flag de recorrência
  recurringDay?: number;         // Dia do mês para recorrência
  attachments?: string[];        // Fotos de recibos
  tags?: string[];               // Tags customizadas
  notes?: string;                // Notas do usuário
  createdAt: Date | string;      // Timestamp de criação
  updatedAt: Date | string;      // Última atualização
}
```

### FixedExpense (Despesa Fixa)
```typescript
interface FixedExpense {
  id: string;                    // UUID único
  name: string;                  // Nome da conta (ex: "Netflix")
  amount: number;                // Valor mensal
  dueDay: number;                // Dia de vencimento (1-31)
  categoryId: string;            // Categoria de despesa
  isActive: boolean;             // Atualmente ativa
  notifications: boolean;        // Notificar antes do vencimento
  notifyDaysBefore: number;      // Dias de antecedência
  description?: string;          // Notas adicionais
  paymentHistory: PaymentRecord[]; // Rastreamento de pagamentos mensais
  createdAt: Date | string;      // Criada quando
  updatedAt: Date | string;      // Última modificação
}
```

---

## 🎨 Design & UX

### Tema Dark com Alto Contraste
- **Sistema de Cores** - 18 variáveis CSS configuráveis
- **Contraste WCAG AAA** - Atende padrões de acessibilidade
- **Tipografia Bold** - Fontes extra-bold (700-800) para legibilidade
- **Cores de Acento**:
  - 💚 Receitas (Verde): #10b981
  - 🔴 Despesas (Vermelho): #ef4444
  - 🔵 Neutro (Azul): #3b82f6

### Design Responsivo Mobile-First
- **Safe Area Insets** - Respeita notches e bordas do dispositivo
- **Touch-Friendly** - Alvos de toque mínimos de 44x44px
- **Suporte a Landscape** - Preparado para orientação horizontal
- **Performance** - Lazy loading de componentes via router
- **Animações Suaves** - Transições entre páginas

### Elementos Interativos
- **FAB Expansível** - Botão flutuante com opções de receita/despesa
- **Gestos de Swipe** - Deslize para editar/excluir em listas
- **Pull-to-Refresh** - Recarregamento manual de dados
- **Formulários Modal** - Entrada centralizada para transações
- **Controles de Segmento** - Filtragem tipo tab

---

## 🚦 Roadmap

### ✅ Implementado (v0.0.1)
- [x] Sistema completo de transações
- [x] Gestão de despesas fixas
- [x] Dashboard com gráficos interativos
- [x] Relatórios mensais e anuais
- [x] Exportação PDF, CSV e PNG
- [x] Autenticação biométrica
- [x] Sistema de notificações
- [x] Tema dark com acessibilidade
- [x] Armazenamento offline IndexedDB
- [x] Arquitetura standalone Angular 19

### 🔜 Próximas Features
- [ ] OCR para escaneamento de recibos
- [ ] Metas de orçamento por categoria
- [ ] Widgets para home screen
- [ ] Backup opcional em nuvem (AWS S3)
- [ ] Sincronização multi-dispositivo
- [ ] Insights com IA para padrões de gastos
- [ ] Alertas de gastos incomuns
- [ ] Mais tipos de gráficos (radar, área, etc.)
- [ ] Suporte a receitas recorrentes

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- **Standalone Components** - Todos os componentes Angular são standalone
- **Type Safety** - TypeScript strict mode
- **Naming Conventions**:
  - Arquivos: kebab-case (dashboard.page.ts)
  - Classes: PascalCase (DashboardPage)
  - Variáveis: camelCase (currentMonth)
  - Constantes: UPPER_SNAKE_CASE (DEFAULT_CATEGORIES)

---

## 📄 License

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ para quem busca privacidade e controle total sobre suas finanças pessoais.

---

## 📞 Suporte

Encontrou um bug? Tem uma sugestão?

- 🐛 [Reporte um Issue](https://github.com/seu-usuario/financial-control/issues)
- 💡 [Sugira uma Feature](https://github.com/seu-usuario/financial-control/issues)
- 📧 [Entre em Contato](mailto:seu-email@exemplo.com)

---

## ⭐ Star History

Se este projeto te ajudou, considere dar uma ⭐ no repositório!

---

<div align="center">

**Financial Control** - Suas finanças, sua privacidade, seu controle.

[⬆ Voltar ao topo](#-financial-control)

</div>
