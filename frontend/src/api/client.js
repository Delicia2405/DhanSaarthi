import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dhansaarthi_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to initialize localStorage mock DB if not present
const initMockDB = () => {
  if (localStorage.getItem("dhansaarthi_mock_db")) {
    return JSON.parse(localStorage.getItem("dhansaarthi_mock_db"));
  }

  const defaultMockDB = {
    transactions: [
      { id: 1, user_id: 1, amount: 120000, type: "income", category: "Income", date: "2026-08-01", source: "csv", description: "HDFC Salary Credit" },
      { id: 2, user_id: 1, amount: 120000, type: "income", category: "Income", date: "2026-07-01", source: "csv", description: "HDFC Salary Credit" },
      { id: 3, user_id: 1, amount: 15000, type: "income", category: "Income", date: "2026-08-15", source: "csv", description: "Freelance UI Project" },
      { id: 4, user_id: 1, amount: 32000, type: "expense", category: "Housing & Rent", date: "2026-08-02", source: "csv", description: "Rent Payment" },
      { id: 5, user_id: 1, amount: 32000, type: "expense", category: "Housing & Rent", date: "2026-07-02", source: "csv", description: "Rent Payment" },
      { id: 6, user_id: 1, amount: 15000, type: "expense", category: "Investments", date: "2026-08-10", source: "csv", description: "Zerodha Nifty 50 SIP" },
      { id: 7, user_id: 1, amount: 15000, type: "expense", category: "Investments", date: "2026-07-10", source: "csv", description: "Zerodha Nifty 50 SIP" },
      { id: 8, user_id: 1, amount: 8400, type: "expense", category: "Groceries", date: "2026-08-03", source: "csv", description: "BigBasket Monthly Groceries" },
      { id: 9, user_id: 1, amount: 6200, type: "expense", category: "Groceries", date: "2026-07-03", source: "csv", description: "BigBasket Monthly Groceries" },
      { id: 10, user_id: 1, amount: 5500, type: "expense", category: "Food & Dining", date: "2026-08-05", source: "csv", description: "Swiggy Dineout & Delivery" },
      { id: 11, user_id: 1, amount: 6800, type: "expense", category: "Food & Dining", date: "2026-07-06", source: "csv", description: "Zomato Restaurant Bill" },
      { id: 12, user_id: 1, amount: 18500, type: "expense", category: "Shopping", date: "2026-08-11", source: "csv", description: "Amazon Electronics Purchase" },
      { id: 13, user_id: 1, amount: 4300, type: "expense", category: "Shopping", date: "2026-07-15", source: "csv", description: "Myntra Clothes" },
      { id: 14, user_id: 1, amount: 3500, type: "expense", category: "Utilities", date: "2026-08-04", source: "csv", description: "Bescom Electricity Bill" },
      { id: 15, user_id: 1, amount: 2800, type: "expense", category: "Transport", date: "2026-08-12", source: "csv", description: "Ola Cab Rides" },
      { id: 16, user_id: 1, amount: 999, type: "expense", category: "Entertainment", date: "2026-08-05", source: "csv", description: "Netflix subscription" },
      { id: 17, user_id: 1, amount: 1500, type: "expense", category: "Health & Fitness", date: "2026-08-18", source: "csv", description: "Apollo Pharmacy Medicine" },
      { id: 18, user_id: 1, amount: 1200, type: "expense", category: "Personal Care", date: "2026-08-20", source: "csv", description: "Urban Company Grooming" },
    ],
    goals: [
      { id: 1, name: "Emergency Fund Buffer", target_amount: 150000, saved_amount: 85000, target_date: "2027-06-30" },
      { id: 2, name: "Europe Vacation Trip", target_amount: 300000, saved_amount: 60000, target_date: "2027-12-31" }
    ],
    riskProfile: {
      risk_profile: "Moderate",
      description: "You seek a balanced approach, seeking growth while maintaining a buffer against steep market swings. A diversified mix of equity and debt suits your wealth-creation needs.",
      allocation: { equities: 50, debt_bonds: 30, cash_fds: 20 },
      score: 6
    }
  };
  localStorage.setItem("dhansaarthi_mock_db", JSON.stringify(defaultMockDB));
  return defaultMockDB;
};

const getMockDB = () => {
  return initMockDB();
};

const saveMockDB = (db) => {
  localStorage.setItem("dhansaarthi_mock_db", JSON.stringify(db));
};

// Calculate dashboard analytics from mock database
const computeMockDashboard = (db) => {
  const txns = db.transactions;
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};
  const monthlyData = {};

  txns.forEach((t) => {
    const amt = parseFloat(t.amount);
    const dateObj = new Date(t.date);
    const monthKey = isNaN(dateObj.getTime()) ? "2026-08" : t.date.substring(0, 7);

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }

    if (t.type === "income" || t.category === "Income") {
      totalIncome += amt;
      monthlyData[monthKey].income += amt;
    } else {
      totalExpense += amt;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
      monthlyData[monthKey].expense += amt;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100 * 10) / 10 : 0;

  const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
    percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100 * 10) / 10 : 0
  })).sort((a, b) => b.amount - a.amount);

  const monthlyTrend = Object.entries(monthlyData).map(([month, vals]) => {
    const savings = vals.income - vals.expense;
    return {
      month,
      income: Math.round(vals.income * 100) / 100,
      expense: Math.round(vals.expense * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      savings_rate: vals.income > 0 ? Math.round((savings / vals.income) * 100 * 10) / 10 : 0
    };
  }).sort((a, b) => a.month.localeCompare(b.month));

  return {
    total_income: Math.round(totalIncome * 100) / 100,
    total_expense: Math.round(totalExpense * 100) / 100,
    net_savings: Math.round(netSavings * 100) / 100,
    savings_rate: savingsRate,
    by_category: categoryTotals,
    category_breakdown: categoryBreakdown,
    monthly_trend: monthlyTrend,
    recent_transactions: txns.slice(-15).reverse(),
    transaction_count: txns.length
  };
};

const computeMockScore = (db, dash) => {
  // Savings Score (25)
  const savingsRate = dash.savings_rate;
  let savingsScore = 0;
  if (savingsRate >= 30) savingsScore = 25;
  else if (savingsRate > 0) savingsScore = (savingsRate / 30) * 25;

  // Spending Control Score (25)
  const discretionaryCategories = ["Shopping", "Entertainment", "Personal Care", "Food & Dining"];
  let discSpend = 0;
  db.transactions.forEach(t => {
    if (t.type === "expense" && discretionaryCategories.includes(t.category)) {
      discSpend += parseFloat(t.amount);
    }
  });
  let spendingScore = 25;
  const ratio = dash.total_expense > 0 ? discSpend / dash.total_expense : 0;
  if (ratio <= 0.2) spendingScore = 25;
  else if (ratio <= 0.7) spendingScore = (1 - (ratio - 0.2) / 0.5) * 25;
  else spendingScore = 0;

  // Emergency Fund Score (25)
  const months = dash.monthly_trend.length || 1;
  const avgMonthlyExpense = dash.total_expense / months;
  const monthsCovered = avgMonthlyExpense > 0 && dash.net_savings > 0 ? dash.net_savings / avgMonthlyExpense : 0;
  let emergencyScore = monthsCovered >= 6 ? 25 : (monthsCovered / 6) * 25;

  // Goals Score (25)
  let goalScore = 15;
  let avgProgress = 0;
  if (db.goals.length > 0) {
    let sumProgress = 0;
    db.goals.forEach(g => {
      sumProgress += Math.min(g.saved_amount / g.target_amount, 1.0);
    });
    avgProgress = sumProgress / db.goals.length;
    goalScore = avgProgress * 25;
  }

  const score = Math.round(savingsScore + spendingScore + emergencyScore + goalScore);

  return {
    confidence_score: score,
    score_history: [
      { date: "2026-06-30", score: Math.max(30, score - 15) },
      { date: "2026-07-31", score: Math.max(30, score - 5) },
      { date: "2026-08-22", score: score }
    ],
    updated_at: new Date().toISOString(),
    breakdown: {
      savings_rate: { score: Math.round(savingsScore * 10) / 10, max_score: 25, value: savingsRate, unit: "%", label: "Savings Rate" },
      spending_control: { score: Math.round(spendingScore * 10) / 10, max_score: 25, value: Math.round(ratio * 100 * 10) / 10, unit: "%", label: "Discretionary Spending Ratio" },
      emergency_fund: { score: Math.round(emergencyScore * 10) / 10, max_score: 25, value: Math.round(monthsCovered * 10) / 10, unit: " months", label: "Emergency Fund Coverage" },
      goal_progress: { score: Math.round(goalScore * 10) / 10, max_score: 25, value: Math.round(avgProgress * 100 * 10) / 10, unit: "%", label: "Goal Completion Rate" }
    }
  };
};

const computeMockInsights = (db, dash) => {
  const insights = [];
  const sr = dash.savings_rate;
  if (sr < 20) {
    insights.push({ type: "warning", icon: "🔴", text: `Your savings rate is only ${sr}%, which is below the recommended 30% mark for stable growth.` });
    insights.push({ type: "action", icon: "🟢", text: "Create an auto-debit rule to invest 10% of your salary immediately on payday to force savings." });
  } else {
    insights.push({ type: "info", icon: "🟢", text: `Your savings rate is a healthy ${sr}%. Keep it up to achieve your goals early.` });
  }

  // Check categories
  const shopping = dash.category_breakdown.find(c => c.category === "Shopping");
  if (shopping && shopping.percentage > 20) {
    insights.push({ type: "warning", icon: "🔴", text: `Shopping consumes ${shopping.percentage}% (INR ${shopping.amount.toLocaleString()}) of your monthly spend.` });
    insights.push({ type: "action", icon: "🟢", text: `Reducing shopping bills by 20% would redirect INR ${(shopping.amount * 0.2).toLocaleString()} to your Europe Vacation goal.` });
  }

  // Emergency Fund
  const months = dash.monthly_trend.length || 1;
  const avgExpense = dash.total_expense / months;
  const coverage = avgExpense > 0 && dash.net_savings > 0 ? dash.net_savings / avgExpense : 0;
  if (coverage < 3) {
    insights.push({ type: "warning", icon: "🔴", text: `Your emergency buffer covers just ${Math.round(coverage * 10) / 10} months of costs.` });
  } else {
    insights.push({ type: "info", icon: "🟡", text: `Your emergency fund covers ${Math.round(coverage * 10) / 10} months of expenses.` });
  }

  return insights.slice(0, 4);
};

// Unified request handler that handles failover
const callAPI = async (endpoint, options = {}) => {
  const { method = "GET", data = null, params = {} } = options;
  const userId = params.user_id || 1;

  try {
    const response = await api({
      url: endpoint,
      method,
      data,
      params,
    });
    return response.data;
  } catch (error) {
    console.warn(`[DhanSaarthi API] Failover: Connection to backend failed for ${method} ${endpoint}. Loading high-fidelity mock data.`);
    const db = getMockDB();

    if (endpoint === "/auth/register" && method === "POST") {
      const email = (data.email || "").trim().toLowerCase();
      const name = (data.name || "").trim();
      if (!db.users) db.users = [];
      if (db.users.find((u) => u.email === email)) {
        throw { response: { status: 400, data: { error: "A user with this email already exists" } } };
      }
      const newUser = { id: Date.now(), email, name };
      db.users.push(newUser);
      saveMockDB(db);
      return { status: "success", token: `mock-token-${newUser.id}`, user: newUser };
    }

    if (endpoint === "/auth/login" && method === "POST") {
      const email = (data.email || "").trim().toLowerCase();
      if (!db.users) db.users = [];
      let user = db.users.find((u) => u.email === email);
      if (!user) {
        user = { id: 1, email, name: email.split("@")[0] };
        db.users.push(user);
        saveMockDB(db);
      }
      return { status: "success", token: `mock-token-${user.id}`, user: user };
    }

    if (endpoint === "/auth/me" && method === "GET") {
      const token = localStorage.getItem("dhansaarthi_token") || "mock-token-1";
      const parts = token.split("-");
      const parsedId = parseInt(parts[parts.length - 1]) || 1;
      if (!db.users) db.users = [];
      const user = db.users.find((u) => u.id === parsedId) || { id: 1, email: "demo@dhansaarthi.demo", name: "Demo User" };
      return { status: "success", user };
    }

    if (endpoint === "/upload" && method === "POST") {
      // Mock File Upload (returns success and appends a few transactions)
      const newTxns = [
        { id: Date.now() + 1, user_id: userId, amount: 60000, type: "income", category: "Income", date: "2026-08-22", source: "csv", description: "Freelance Payout" },
        { id: Date.now() + 2, user_id: userId, amount: 1200, type: "expense", category: "Food & Dining", date: "2026-08-22", source: "csv", description: "Cafe Coffee Day" },
        { id: Date.now() + 3, user_id: userId, amount: 4800, type: "expense", category: "Shopping", date: "2026-08-22", source: "csv", description: "Decathlon Sports Gear" }
      ];
      db.transactions = [...db.transactions, ...newTxns];
      saveMockDB(db);
      return { status: "success", imported: newTxns.length, transactions: newTxns };
    }

    if (endpoint === "/dashboard") {
      return computeMockDashboard(db);
    }

    if (endpoint === "/score") {
      const dash = computeMockDashboard(db);
      return computeMockScore(db, dash);
    }

    if (endpoint === "/goals") {
      if (method === "GET") {
        const dash = computeMockDashboard(db);
        return db.goals.map((g) => {
          const remaining = Math.max(g.target_amount - g.saved_amount, 0);
          const months = Math.max((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24 * 30.44), 1);
          const req = remaining / months;
          const avgMonthlySavings = dash.total_income > 0 ? (dash.net_savings / (dash.monthly_trend.length || 1)) : 0;
          const trajectory = g.saved_amount + (avgMonthlySavings * months);
          const shortfall = Math.max(g.target_amount - trajectory, 0);
          const suggestedIncrease = shortfall / months;

          return {
            ...g,
            remaining_amount: Math.round(remaining * 100) / 100,
            months_remaining: Math.round(months * 10) / 10,
            monthly_required: Math.round(req * 100) / 100,
            avg_monthly_savings: Math.round(avgMonthlySavings * 100) / 100,
            projected_savings: Math.round(trajectory * 100) / 100,
            shortfall: Math.round(shortfall * 100) / 100,
            suggested_monthly_increase: Math.round(suggestedIncrease * 100) / 100
          };
        });
      }

      if (method === "POST") {
        const newGoal = {
          id: Date.now(),
          name: data.name,
          target_amount: parseFloat(data.target_amount),
          saved_amount: parseFloat(data.saved_amount || 0),
          target_date: data.target_date
        };
        db.goals.push(newGoal);
        saveMockDB(db);
        return newGoal;
      }
    }

    if (endpoint.startsWith("/goals/")) {
      const parts = endpoint.split("/");
      const goalId = parseInt(parts[2]);

      if (method === "PUT") {
        db.goals = db.goals.map((g) => {
          if (g.id === goalId) {
            return {
              ...g,
              name: data.name !== undefined ? data.name : g.name,
              target_amount: data.target_amount !== undefined ? parseFloat(data.target_amount) : g.target_amount,
              saved_amount: data.saved_amount !== undefined ? parseFloat(data.saved_amount) : g.saved_amount,
              target_date: data.target_date !== undefined ? data.target_date : g.target_date,
            };
          }
          return g;
        });
        saveMockDB(db);
        return db.goals.find((g) => g.id === goalId);
      }

      if (method === "DELETE") {
        db.goals = db.goals.filter((g) => g.id !== goalId);
        saveMockDB(db);
        return { status: "success", message: `Goal ${goalId} deleted.` };
      }
    }

    if (endpoint === "/insights") {
      const dash = computeMockDashboard(db);
      return { recommendations: computeMockInsights(db, dash) };
    }

    if (endpoint === "/risk-profile" && method === "POST") {
      // Risk Profiling Logic
      const g = data.goal || "balance";
      const r = data.reaction || "hold";
      const h = data.horizon || "medium";
      let score = 0;
      if (g === "growth") score += 3;
      else if (g === "balance") score += 2;
      else score += 1;

      if (r === "buy") score += 3;
      else if (r === "hold") score += 2;
      else score += 1;

      if (h === "long") score += 3;
      else if (h === "medium") score += 2;
      else score += 1;

      let profile, desc, alloc;
      if (score >= 8) {
        profile = "Aggressive";
        desc = "You prioritize wealth growth over capital preservation. You have a high capacity to withstand short-term volatility in exchange for potential long-term compounding benefits.";
        alloc = { equities: 75, debt_bonds: 15, cash_fds: 10 };
      } else if (score >= 5) {
        profile = "Moderate";
        desc = "You seek a balanced approach, seeking growth while maintaining a buffer against steep market swings. A diversified mix of equity and debt suits your wealth-creation needs.";
        alloc = { equities: 50, debt_bonds: 30, cash_fds: 20 };
      } else {
        profile = "Conservative";
        desc = "You prioritize capital safety and regular interest income. You have a low tolerance for portfolio fluctuations and prefer secure channels like fixed deposits and high-quality debt.";
        alloc = { equities: 20, debt_bonds: 50, cash_fds: 30 };
      }

      const riskRes = { risk_profile: profile, description: desc, allocation: alloc, score };
      db.riskProfile = riskRes;
      saveMockDB(db);
      return riskRes;
    }

    if (endpoint === "/chat" && method === "POST") {
      const q = (data.message || "").toLowerCase().trim();
      const dash = computeMockDashboard(db);
      const scoreObj = computeMockScore(db, dash);
      
      let reply = "";
      let suggestions = [
        "Where is most of my money going?",
        "How to improve my confidence score?",
        "Can I reach my financial goals?"
      ];

      if (q.includes("hi") || q.includes("hello") || q.includes("who are you") || q.includes("help")) {
        reply = `👋 **Namaste!** I am **Saarthi AI**, your personal wealth copilot.\n\n` +
          `- 🛡️ **Confidence Score:** \`${scoreObj.confidence_score}/100\`\n` +
          `- 💰 **Net Savings Rate:** \`${dash.savings_rate}%\` (INR ${dash.net_savings.toLocaleString()} total saved)\n` +
          `- 🎯 **Active Goals:** ${db.goals.length} goals in progress\n\n` +
          `Ask me anything about your spending, goals, or budgeting!`;
      } else if (q.includes("food") || q.includes("dining") || q.includes("swiggy") || q.includes("zomato")) {
        const dining = dash.category_breakdown.find(c => c.category.toLowerCase().includes("food") || c.category.toLowerCase().includes("dining"));
        const amt = dining ? dining.amount : 5500;
        const pct = dining ? dining.percentage : 8.5;
        reply = `🍽️ **Food & Dining Spending Analysis**\n\n` +
          `- **Total Spent:** INR ${amt.toLocaleString()}\n` +
          `- **Share of Expenses:** ${pct}%\n\n` +
          `💡 *Tip:* Reducing weekend deliveries by 20% would redirect ~INR ${Math.round(amt * 0.2).toLocaleString()} straight to your goals.`;
        suggestions = ["Show my top 3 biggest expenses", "Where can I cut monthly costs?", "Check my savings rate"];
      } else if (q.includes("shopping") || q.includes("amazon") || q.includes("myntra")) {
        const shop = dash.category_breakdown.find(c => c.category.toLowerCase().includes("shopping"));
        const amt = shop ? shop.amount : 18500;
        const pct = shop ? shop.percentage : 25.0;
        reply = `🛍️ **Shopping Expenses Analysis**\n\n` +
          `- **Total Spent:** INR ${amt.toLocaleString()}\n` +
          `- **Share of Expenses:** ${pct}%\n\n` +
          `💡 *Recommendation:* Shopping is currently ${pct}% of your budget. Practicing the 72-hour delay rule on carts over INR 2,000 will prevent impulse purchases.`;
        suggestions = ["Where can I cut expenses safely?", "What are my top expenses?", "How to boost confidence score?"];
      } else if (q.includes("top") || q.includes("biggest") || q.includes("breakdown") || q.includes("where is my money")) {
        const top3 = dash.category_breakdown.slice(0, 3);
        const listStr = top3.map((c, i) => `${i + 1}. **${c.category}**: INR ${c.amount.toLocaleString()} (*${c.percentage}%*)`).join("\n");
        reply = `💸 **Your Top Expense Categories**\n\n` +
          `Total Expenses: **INR ${dash.total_expense.toLocaleString()}**\n\n` +
          listStr + `\n\n🎯 *Focusing on capping discretionary categories will yield the fastest boost to your savings.*`;
        suggestions = ["Where can I cut expenses?", "How does this affect my Confidence Score?", "Review my financial goals"];
      } else if (q.includes("score") || q.includes("confidence") || q.includes("health") || q.includes("improve")) {
        reply = `🛡️ **Financial Confidence Score: \`${scoreObj.confidence_score}/100\`**\n\n` +
          `- **Savings Rate:** \`${scoreObj.breakdown.savings_rate.score}/25\` (${dash.savings_rate}%)\n` +
          `- **Spending Control:** \`${scoreObj.breakdown.spending_control.score}/25\`\n` +
          `- **Emergency Fund:** \`${scoreObj.breakdown.emergency_fund.score}/25\` (${scoreObj.breakdown.emergency_fund.value} months)\n` +
          `- **Goal Progress:** \`${scoreObj.breakdown.goal_progress.score}/25\`\n\n` +
          `🚀 **To achieve a 90+ Score:**\n` +
          `1. Boost your savings rate towards 30% via payday auto-SIPs.\n` +
          `2. Build your emergency fund to 6 months of living expenses.`;
        suggestions = ["What are my top expenses?", "Can I reach my goals on time?", "Show recent transactions"];
      } else if (q.includes("goal") || q.includes("vacation") || q.includes("afford") || q.includes("target")) {
        const goalList = db.goals.map(g => `- 🎯 **${g.name}**: Target INR ${g.target_amount.toLocaleString()} (Saved: INR ${g.saved_amount.toLocaleString()} - ${Math.round((g.saved_amount / g.target_amount) * 100)}%)`).join("\n");
        reply = `🎯 **Financial Goals Progress**\n\n` +
          (goalList || "No goals found. Add goals in the Financial Goals tab!") +
          `\n\n💰 **Monthly Surplus:** INR ${dash.net_savings.toLocaleString()} total available.`;
        suggestions = ["Where can I cut costs to meet goals?", "What is my investment asset allocation?", "Check confidence score"];
      } else {
        reply = `💡 **Financial Summary for your account**\n\n` +
          `- **Income Inflow:** INR ${dash.total_income.toLocaleString()}\n` +
          `- **Expenses Outflow:** INR ${dash.total_expense.toLocaleString()}\n` +
          `- **Net Savings:** INR ${dash.net_savings.toLocaleString()} (${dash.savings_rate}% rate)\n` +
          `- **Confidence Score:** ${scoreObj.confidence_score}/100\n\n` +
          `You can ask me specific questions about your spending, goals, or budgeting tips!`;
      }

      return { status: "success", reply, suggestions };
    }

    if (endpoint === "/aggregator/discover" && method === "POST") {
      const mockAccounts = [
        { id: "acc_hdfc_01", bank_name: "HDFC Bank", account_type: "Salary Account", account_number: "XXXX-XXXX-4812", ifsc: "HDFC0001234", balance: 85400.00, branch: "Indiranagar, Bengaluru", logo_color: "#004c8f" },
        { id: "acc_sbi_02", bank_name: "State Bank of India", account_type: "Savings Account", account_number: "XXXX-XXXX-9031", ifsc: "SBIN0004567", balance: 142800.00, branch: "MG Road, Bengaluru", logo_color: "#280071" },
        { id: "acc_icici_03", bank_name: "ICICI Bank", account_type: "Emergency Savings", account_number: "XXXX-XXXX-2240", ifsc: "ICIC0007890", balance: 65200.00, branch: "Koramangala, Bengaluru", logo_color: "#f37021" },
        { id: "acc_axis_04", bank_name: "Axis Bank", account_type: "Secondary Savings", account_number: "XXXX-XXXX-7719", ifsc: "UTIB0003210", balance: 28500.00, branch: "Whitefield, Bengaluru", logo_color: "#97144d" },
        { id: "acc_kotak_05", bank_name: "Kotak Mahindra Bank", account_type: "Everyday Spending", account_number: "XXXX-XXXX-5512", ifsc: "KKBK0006543", balance: 14350.00, branch: "HSR Layout, Bengaluru", logo_color: "#ed1c24" }
      ];
      return { status: "success", accounts: mockAccounts };
    }

    if (endpoint === "/aggregator/request-otp" && method === "POST") {
      return {
        status: "success",
        session_id: `aa_sess_${Date.now()}`,
        otp_hint: "123456",
        consent_artifact: {
          purpose: "Personal Financial Management & Automated Wealth Insights",
          data_frequency: "Periodic / Real-Time Daily",
          data_range: "Past 6 Months to Current",
          valid_until: "2027-08-22",
          revocable: true
        }
      };
    }

    if (endpoint === "/aggregator/verify-consent" && method === "POST") {
      const mockTxns = [
        { id: Date.now() + 1, user_id: userId, amount: 85000, type: "income", category: "Income", date: "2026-08-01", source: "AA:HDFC Bank", description: "HDFC Bank - Salary Credit Tech Corp" },
        { id: Date.now() + 2, user_id: userId, amount: 22000, type: "expense", category: "Housing & Rent", date: "2026-08-02", source: "AA:HDFC Bank", description: "HDFC Bank - House Rent Payment" },
        { id: Date.now() + 3, user_id: userId, amount: 15000, type: "expense", category: "Investments", date: "2026-08-08", source: "AA:HDFC Bank", description: "HDFC Bank - Zerodha Nifty 50 SIP" },
        { id: Date.now() + 4, user_id: userId, amount: 5000, type: "expense", category: "Investments", date: "2026-08-10", source: "AA:State Bank of India", description: "SBI - Bluechip Mutual Fund SIP" },
        { id: Date.now() + 5, user_id: userId, amount: 4800, type: "expense", category: "Groceries", date: "2026-08-05", source: "AA:State Bank of India", description: "SBI - DMart Supermarket Monthly" },
        { id: Date.now() + 6, user_id: userId, amount: 15000, type: "income", category: "Income", date: "2026-08-15", source: "AA:ICICI Bank", description: "ICICI - Freelance UI/UX Payout" }
      ];
      db.transactions = [...db.transactions, ...mockTxns];
      saveMockDB(db);
      return { status: "success", imported_transactions_count: mockTxns.length, message: "Bank accounts successfully linked!" };
    }

    if (endpoint === "/aggregator/linked-accounts" && method === "GET") {
      const mockAccounts = [
        { id: "acc_hdfc_01", bank_name: "HDFC Bank", account_type: "Salary Account", account_number: "XXXX-XXXX-4812", balance: 85400.00 },
        { id: "acc_sbi_02", bank_name: "State Bank of India", account_type: "Savings Account", account_number: "XXXX-XXXX-9031", balance: 142800.00 }
      ];
      return { status: "success", linked_accounts: mockAccounts, total_balance: 228200.00 };
    }

    // Default empty return
    return {};
  }
};

export const apiService = {
  uploadStatement: (file, userId = 1) => {
    const formData = new FormData();
    formData.append("file", file);
    return callAPI("/upload", {
      method: "POST",
      data: formData,
      params: { user_id: userId }
    });
  },
  discoverAccounts: (phone, aaHandle, userId = 1) => {
    return callAPI("/aggregator/discover", {
      method: "POST",
      data: { phone, aa_handle: aaHandle },
      params: { user_id: userId }
    });
  },
  requestAAOtp: (phone, selectedAccountIds, userId = 1) => {
    return callAPI("/aggregator/request-otp", {
      method: "POST",
      data: { phone, selected_account_ids: selectedAccountIds },
      params: { user_id: userId }
    });
  },
  verifyAAConsent: (otp, selectedAccountIds, userId = 1) => {
    return callAPI("/aggregator/verify-consent", {
      method: "POST",
      data: { otp, selected_account_ids: selectedAccountIds },
      params: { user_id: userId }
    });
  },
  getLinkedAccounts: (userId = 1) => {
    return callAPI("/aggregator/linked-accounts", { params: { user_id: userId } });
  },
  getDashboard: (userId = 1) => {
    return callAPI("/dashboard", { params: { user_id: userId } });
  },
  getScore: (userId = 1) => {
    return callAPI("/score", { params: { user_id: userId } });
  },
  getGoals: (userId = 1) => {
    return callAPI("/goals", { params: { user_id: userId } });
  },
  createGoal: (goalData, userId = 1) => {
    return callAPI("/goals", {
      method: "POST",
      data: { ...goalData, user_id: userId },
      params: { user_id: userId }
    });
  },
  updateGoal: (goalId, goalData, userId = 1) => {
    return callAPI(`/goals/${goalId}`, {
      method: "PUT",
      data: goalData,
      params: { user_id: userId }
    });
  },
  deleteGoal: (goalId, userId = 1) => {
    return callAPI(`/goals/${goalId}`, {
      method: "DELETE",
      params: { user_id: userId }
    });
  },
  submitRiskProfile: (answers, userId = 1) => {
    return callAPI("/risk-profile", {
      method: "POST",
      data: answers,
      params: { user_id: userId }
    });
  },
  getInsights: (userId = 1) => {
    return callAPI("/insights", { params: { user_id: userId } });
  },
  sendChatMessage: (message, history = [], userId = 1) => {
    return callAPI("/chat", {
      method: "POST",
      data: { message, history },
      params: { user_id: userId }
    });
  },
  login: (credentials) => {
    return callAPI("/auth/login", {
      method: "POST",
      data: credentials
    });
  },
  register: (userData) => {
    return callAPI("/auth/register", {
      method: "POST",
      data: userData
    });
  },
  getMe: () => {
    return callAPI("/auth/me");
  }
};
