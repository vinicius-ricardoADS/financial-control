# App Financeiro - Documentação de Desenvolvimento

## Visão Geral

Aplicativo mobile de controle financeiro desenvolvido com **Ionic 8 + Angular 19 (Standalone)** para gerenciar receitas, despesas, despesas fixas e gerar relatórios com gráficos.

## Arquitetura Implementada

### 📁 Estrutura de Pastas

```
src/
├── models/                      # Modelos de dados
│   ├── category.model.ts        # Categorias (13 categorias padrão)
│   ├── transaction.model.ts     # Transações (receitas/despesas)
│   ├── fixed-expense.model.ts   # Despesas fixas recorrentes
│   └── financial-summary.model.ts # Resumo financeiro
│
├── services/                    # Serviços da aplicação
│   ├── storage.service.ts       # Ionic Storage (IndexedDB)
│   ├── category.service.ts      # CRUD de categorias
│   ├── transaction.service.ts   # CRUD de transações
│   ├── fixed-expense.service.ts # CRUD de despesas fixas
│   ├── report.service.ts        # Geração de relatórios
│   └── export.service.ts        # Exportação PDF/Imagem/CSV
│
├── app/pages/                   # Páginas da aplicação
│   ├── home/                    # Shell com tabs navigation
│   ├── dashboard/               # Dashboard principal
│   ├── transactions/            # Lista e cadastro de transações
│   ├── fixed-expenses/          # Gerenciamento de despesas fixas
│   └── reports/                 # Gráficos e relatórios
│
└── guards/
    └── auth.guard.ts            # Guard de autenticação biométrica
```

## Funcionalidades Implementadas

### 🏠 Dashboard
- Card com resumo do mês (Receitas, Despesas, Saldo)
- Gráfico de pizza (Despesas por categoria)
- Lista das últimas 5 transações
- Pull-to-refresh
- Design responsivo e elegante

### 💰 Transações
- Adicionar/Editar/Excluir transações
- Categorização (13 categorias padrão)
- Filtros (Todas/Receitas/Despesas)
- Busca por texto
- Swipe para editar/deletar
- Formulário modal com validação
- Suporte a notas/observações

### 📌 Despesas Fixas
- Cadastro de despesas recorrentes
- Definir dia de vencimento (1-31)
- Ativar/Desativar despesas
- Histórico de pagamentos
- Notificações configuráveis

### 📊 Relatórios
- **Gráfico de Linha**: Evolução anual (receitas vs despesas)
- **Gráfico de Barras**: Comparativo mensal
- **Gráfico de Pizza**: Distribuição por categoria
- Comparação percentual (mês atual vs anterior)
- **Exportação em PDF** com resumo completo
- Exportação de gráficos em imagem
- Exportação de transações em CSV

## Tecnologias Utilizadas

### Core
- **Ionic 8.5.1** - Framework mobile
- **Angular 19.2.3** (Standalone Components)
- **Capacitor 7.1.0** - Bridge nativo

### Armazenamento
- **Ionic Storage Angular 4.0.0** - Persistência local (IndexedDB)

### Gráficos
- **Chart.js 4.4.8** - Gráficos interativos

### Exportação
- **jsPDF** - Geração de PDF
- **jspdf-autotable** - Tabelas em PDF
- **html2canvas** - Conversão de elementos HTML para imagem

### Utilitários
- **Moment.js 2.30.1** - Manipulação de datas
- **Lodash 4.17.21** - Funções utilitárias

### Plugins Capacitor
- **capacitor-native-biometric** - Autenticação biométrica
- **@capacitor/share** - Compartilhamento de arquivos
- **@capacitor/filesystem** - Acesso ao sistema de arquivos

## Navegação

### Tab Navigation (Bottom)
```
├── Dashboard    [📊] - Visão geral e resumo
├── Transações   [💳] - Lista/adicionar transações
├── Fixas        [🔔] - Despesas fixas
└── Relatórios   [📈] - Gráficos e exportação
```

## Armazenamento de Dados

### IndexedDB (via Ionic Storage)
- **Database**: `__financedb`
- **Collections**:
  - `categories` - Categorias de transações
  - `transactions` - Todas as transações
  - `fixed-expenses` - Despesas fixas

### Categorias Padrão (13)

**Despesas (9):**
1. Alimentação
2. Transporte
3. Moradia
4. Saúde
5. Educação
6. Lazer
7. Compras
8. Contas
9. Outros

**Receitas (4):**
1. Salário
2. Investimentos
3. Freelance
4. Outros

## Funcionalidades Premium/Diferenciais

### Relatórios Inteligentes
- Cálculo automático de média diária de gastos
- Projeção de gastos futuros baseado em histórico
- Comparação percentual entre meses
- Análise de tendência por categoria

### Exportação Profissional
- PDF formatado com resumo completo
- Tabelas de categorias e transações
- Rodapé com data de geração
- Paginação automática
- Opção de compartilhar via apps nativos

### UX/UI Mobile-First
- Pull-to-refresh em todas as listas
- Swipe gestures para ações rápidas
- Loading states e skeleton loaders
- Validação de formulários em tempo real
- Design Material Design + Ionic
- Suporte a Dark Mode (preparado)

## Como Executar

### Desenvolvimento (Navegador)
```bash
ionic serve
# ou
npm start
```

### Build de Produção
```bash
npm run build:prd
```

### Android
```bash
# Build e abrir no Android Studio
npm run open:android

# Build e executar em dispositivo/emulador
npm run start:android

# Sincronizar assets
npm run sync:android
```

## Autenticação

O app possui **AuthGuard** com autenticação biométrica:
- **No navegador**: Desabilitado (modo desenvolvimento)
- **Em dispositivo**: Exige biometria/PIN para acesso

## Próximas Melhorias Sugeridas

1. **Backend/Sync**
   - Integração com API para backup na nuvem (AWS SDK já instalado)
   - Sincronização entre dispositivos

2. **Recursos Avançados**
   - OCR para leitura de notas fiscais
   - Metas financeiras personalizadas
   - Widgets para tela inicial
   - Notificações push para vencimentos

3. **Inteligência**
   - Sugestões baseadas em padrões de gastos
   - Alertas de gastos excessivos
   - Previsão de saldo futuro com IA

4. **Relatórios**
   - Mais tipos de gráficos (área, radar)
   - Relatórios customizáveis
   - Comparação entre categorias

## Estrutura de Dados

### Transaction
```typescript
{
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  description: string;
  date: Date | string;
  isRecurring: boolean;
  notes?: string;
  tags?: string[];
}
```

### FixedExpense
```typescript
{
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  categoryId: string;
  isActive: boolean;
  notifications: boolean;
  paymentHistory: PaymentRecord[];
}
```

### FinancialSummary
```typescript
{
  period: { month, year, startDate, endDate };
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: CategoryExpense[];
  incomeByCategory: CategoryIncome[];
  dailyAverage: number;
  projection: { estimatedExpenses, estimatedIncome, estimatedBalance };
}
```

## Padrões de Código

- **Standalone Components**: Todos os componentes são standalone
- **Services**: Injetados via `providedIn: 'root'`
- **RxJS**: BehaviorSubject para estado reativo
- **TypeScript**: Tipagem forte em todos os lugares
- **Async/Await**: Para operações assíncronas
- **Moment.js**: Para manipulação de datas

## Build Info

- **Angular CLI**: 19.2.4
- **Node**: >=20.17.0
- **NPM**: ~10.8.2
- **Target**: ES2022
- **TypeScript**: 5.8.2

## Autor

Desenvolvido por Claude Code (Anthropic)
Data: 2025-11-06
