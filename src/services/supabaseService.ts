import { getSupabaseClient } from '../lib/supabase';
import {
  Category,
  RecurringBill,
  SavingsGoal,
  Transaction,
  UserPreferences,
} from '../types';

export interface RemoteVaultData {
  transactions: Transaction[];
  categories: Category[];
  savingsGoals: SavingsGoal[];
  recurringBills: RecurringBill[];
  preferences: UserPreferences;
}

/**
 * Loads all user financial records from Supabase
 */
export async function fetchRemoteVaultData(
  userId: string,
  currentCategories: Category[],
  currentPreferences: UserPreferences
): Promise<RemoteVaultData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // 1. Fetch Categories (both system default + user custom)
    const { data: catData, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false });

    if (catErr) console.warn('Supabase fetch categories warning:', catErr.message);

    const mergedCategories: Category[] = catData && catData.length > 0
      ? catData.map((c: any) => ({
          id: c.id,
          name: c.name,
          iconName: c.icon_name || 'HelpCircle',
          color: c.color || '#10b981',
          type: c.type || 'expense',
          budgetLimit: c.budget_limit !== undefined ? Number(c.budget_limit) : 0,
        }))
      : currentCategories;

    // 2. Fetch User Preferences & Monthly Budgets
    const { data: prefData } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: monthBudgetsData } = await supabase
      .from('monthly_budgets')
      .select('year_month, amount')
      .eq('user_id', userId);

    const monthlyBudgetsRecord: Record<string, number> = {};
    if (monthBudgetsData) {
      for (const b of monthBudgetsData) {
        monthlyBudgetsRecord[b.year_month] = Number(b.amount);
      }
    }

    const mergedPreferences: UserPreferences = {
      baseCurrency: prefData?.base_currency || currentPreferences.baseCurrency || 'INR',
      privacyMode: prefData?.privacy_mode ?? currentPreferences.privacyMode ?? false,
      pinCode: currentPreferences.pinCode, // PIN stays on device for privacy
      isLocked: false,
      overallMonthlyBudget: prefData?.overall_monthly_budget !== undefined
        ? Number(prefData.overall_monthly_budget)
        : currentPreferences.overallMonthlyBudget || 0,
      monthlyBudgets: {
        ...(currentPreferences.monthlyBudgets || {}),
        ...monthlyBudgetsRecord,
      },
      initialOpeningBalance: prefData?.initial_opening_balance !== undefined
        ? Number(prefData.initial_opening_balance)
        : currentPreferences.initialOpeningBalance || 0,
      safeDailyBudgetEnabled: prefData?.safe_daily_budget_enabled ?? currentPreferences.safeDailyBudgetEnabled ?? true,
      theme: prefData?.theme || currentPreferences.theme || 'light',
      isPhoneFrameView: prefData?.is_phone_frame_view ?? currentPreferences.isPhoneFrameView ?? false,
    };

    // 3. Fetch Transactions
    const { data: txData, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (txErr) console.warn('Supabase fetch transactions warning:', txErr.message);

    const mergedTransactions: Transaction[] = (txData || []).map((t: any) => ({
      id: t.client_tx_id || t.id,
      type: t.type,
      amount: Number(t.amount),
      currency: t.currency || 'INR',
      convertedAmount: Number(t.converted_amount ?? t.amount),
      categoryId: t.category_id || 'cat_other_exp',
      account: t.account || 'upi',
      date: t.date || t.transaction_date,
      merchant: t.merchant || undefined,
      source: t.source || undefined,
      note: t.note || t.description || undefined,
      tags: t.tags || [],
      isRecurring: t.is_recurring || false,
      recurringInterval: t.recurring_interval || undefined,
      receiptAttached: t.receipt_attached || false,
    }));

    // 4. Fetch Savings Goals
    const { data: goalsData } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId);

    const mergedGoals: SavingsGoal[] = (goalsData || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      targetAmount: Number(g.target_amount),
      currentAmount: Number(g.current_amount),
      currency: g.currency || 'INR',
      deadlineDate: g.deadline_date,
      iconName: g.icon_name || 'Target',
      color: g.color || '#10b981',
    }));

    // 5. Fetch Recurring Bills
    const { data: billsData } = await supabase
      .from('recurring_bills')
      .select('*')
      .eq('user_id', userId);

    const mergedBills: RecurringBill[] = (billsData || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      amount: Number(b.amount),
      currency: b.currency || 'INR',
      categoryId: b.category_id || 'cat_utilities',
      billingCycle: b.billing_cycle || 'monthly',
      nextBillingDate: b.next_billing_date,
      autoDeduct: b.auto_deduct || false,
      iconName: b.icon_name || 'Repeat',
    }));

    return {
      transactions: mergedTransactions,
      categories: mergedCategories,
      savingsGoals: mergedGoals,
      recurringBills: mergedBills,
      preferences: mergedPreferences,
    };
  } catch (err) {
    console.error('Error fetching vault from Supabase:', err);
    return null;
  }
}

/**
 * Migrates and syncs all local data from localStorage up to Supabase
 */
export async function syncLocalVaultToSupabase(
  userId: string,
  local: {
    transactions: Transaction[];
    categories: Category[];
    savingsGoals: SavingsGoal[];
    recurringBills: RecurringBill[];
    preferences: UserPreferences;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  try {
    // 1. Sync User Preferences
    const { error: prefErr } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        base_currency: local.preferences.baseCurrency,
        privacy_mode: local.preferences.privacyMode,
        overall_monthly_budget: local.preferences.overallMonthlyBudget,
        initial_opening_balance: local.preferences.initialOpeningBalance || 0,
        safe_daily_budget_enabled: local.preferences.safeDailyBudgetEnabled,
        theme: local.preferences.theme,
        is_phone_frame_view: local.preferences.isPhoneFrameView,
      }, { onConflict: 'user_id' });

    if (prefErr) throw prefErr;

    // 2. Sync Monthly Budgets dictionary
    if (local.preferences.monthlyBudgets) {
      const budgetRows = Object.entries(local.preferences.monthlyBudgets).map(([ym, amt]) => ({
        user_id: userId,
        year_month: ym,
        amount: amt,
      }));

      if (budgetRows.length > 0) {
        const { error: mbErr } = await supabase
          .from('monthly_budgets')
          .upsert(budgetRows, { onConflict: 'user_id, year_month' });
        if (mbErr) console.warn('Sync monthly budgets warning:', mbErr);
      }
    }

    // 3. Sync Custom Categories (user-created categories)
    const customCategories = local.categories.filter((c) => !c.id.startsWith('cat_') || c.id.startsWith('cat_custom_'));
    if (customCategories.length > 0) {
      const catRows = customCategories.map((c) => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        icon_name: c.iconName,
        color: c.color,
        type: c.type,
        budget_limit: c.budgetLimit || 0,
        is_default: false,
      }));

      const { error: catErr } = await supabase
        .from('categories')
        .upsert(catRows, { onConflict: 'id' });
      if (catErr) console.warn('Sync custom categories warning:', catErr);
    }

    // 4. Sync Transactions
    if (local.transactions.length > 0) {
      const txRows = local.transactions.map((t) => ({
        user_id: userId,
        client_tx_id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        converted_amount: t.convertedAmount,
        category_id: t.categoryId,
        account: t.account,
        date: t.date,
        transaction_date: t.date,
        note: t.note || null,
        description: t.note || null,
        merchant: t.merchant || null,
        source: t.source || null,
        tags: t.tags || [],
        is_recurring: t.isRecurring || false,
        recurring_interval: t.recurringInterval || null,
        receipt_attached: t.receiptAttached || false,
      }));

      const { error: txErr } = await supabase
        .from('transactions')
        .upsert(txRows, { onConflict: 'user_id, client_tx_id' });
      if (txErr) throw txErr;
    }

    // 5. Sync Savings Goals
    if (local.savingsGoals.length > 0) {
      const goalRows = local.savingsGoals.map((g) => ({
        id: g.id,
        user_id: userId,
        name: g.name,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        currency: g.currency,
        deadline_date: g.deadlineDate,
        icon_name: g.iconName,
        color: g.color,
      }));

      const { error: goalErr } = await supabase
        .from('savings_goals')
        .upsert(goalRows, { onConflict: 'id' });
      if (goalErr) console.warn('Sync savings goals warning:', goalErr);
    }

    // 6. Sync Recurring Bills
    if (local.recurringBills.length > 0) {
      const billRows = local.recurringBills.map((b) => ({
        id: b.id,
        user_id: userId,
        name: b.name,
        amount: b.amount,
        currency: b.currency,
        category_id: b.categoryId,
        billing_cycle: b.billingCycle,
        next_billing_date: b.nextBillingDate,
        auto_deduct: b.autoDeduct,
        icon_name: b.iconName,
      }));

      const { error: billErr } = await supabase
        .from('recurring_bills')
        .upsert(billRows, { onConflict: 'id' });
      if (billErr) console.warn('Sync recurring bills warning:', billErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error syncing local vault to Supabase:', err);
    return { success: false, error: err.message || 'Unknown sync error' };
  }
}

/**
 * Creates a transaction on Supabase in real-time
 */
export async function createRemoteTransaction(
  userId: string,
  tx: Transaction
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('transactions').insert({
      user_id: userId,
      client_tx_id: tx.id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      converted_amount: tx.convertedAmount,
      category_id: tx.categoryId,
      account: tx.account,
      date: tx.date,
      transaction_date: tx.date,
      note: tx.note || null,
      description: tx.note || null,
      merchant: tx.merchant || null,
      source: tx.source || null,
      tags: tx.tags || [],
      is_recurring: tx.isRecurring || false,
      recurring_interval: tx.recurringInterval || null,
      receipt_attached: tx.receiptAttached || false,
    });
  } catch (err) {
    console.error('Error creating remote transaction:', err);
  }
}

/**
 * Deletes a transaction on Supabase
 */
export async function deleteRemoteTransaction(
  userId: string,
  txId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .eq('client_tx_id', txId);
  } catch (err) {
    console.error('Error deleting remote transaction:', err);
  }
}

/**
 * Updates monthly budget on Supabase
 */
export async function updateRemoteMonthlyBudget(
  userId: string,
  yearMonth: string,
  amount: number
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('monthly_budgets').upsert({
      user_id: userId,
      year_month: yearMonth,
      amount,
    }, { onConflict: 'user_id, year_month' });

    await supabase.from('user_preferences').upsert({
      user_id: userId,
      overall_monthly_budget: amount,
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.error('Error updating remote monthly budget:', err);
  }
}

/**
 * Saves or updates a savings goal on Supabase
 */
export async function createOrUpdateRemoteGoal(
  userId: string,
  goal: SavingsGoal
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('savings_goals').upsert({
      id: goal.id,
      user_id: userId,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      currency: goal.currency || 'INR',
      deadline_date: goal.deadlineDate || null,
      icon_name: goal.iconName,
      color: goal.color,
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Error updating remote savings goal:', err);
  }
}

/**
 * Deletes a savings goal on Supabase
 */
export async function deleteRemoteGoal(
  userId: string,
  goalId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('savings_goals').delete().eq('user_id', userId).eq('id', goalId);
  } catch (err) {
    console.error('Error deleting remote savings goal:', err);
  }
}

/**
 * Saves or updates a recurring bill on Supabase
 */
export async function createOrUpdateRemoteBill(
  userId: string,
  bill: RecurringBill
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('recurring_bills').upsert({
      id: bill.id,
      user_id: userId,
      name: bill.name,
      amount: bill.amount,
      currency: bill.currency || 'INR',
      category_id: bill.categoryId,
      billing_cycle: bill.billingCycle,
      next_billing_date: bill.nextBillingDate,
      auto_deduct: bill.autoDeduct,
      icon_name: bill.iconName,
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Error updating remote recurring bill:', err);
  }
}

/**
 * Deletes a recurring bill on Supabase
 */
export async function deleteRemoteBill(
  userId: string,
  billId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('recurring_bills').delete().eq('user_id', userId).eq('id', billId);
  } catch (err) {
    console.error('Error deleting remote recurring bill:', err);
  }
}

/**
 * Saves or updates custom categories on Supabase
 */
export async function createOrUpdateRemoteCategory(
  userId: string,
  category: Category
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('categories').upsert({
      id: category.id,
      user_id: userId,
      name: category.name,
      icon_name: category.iconName,
      color: category.color,
      type: category.type,
      budget_limit: category.budgetLimit || 0,
      is_default: category.id.startsWith('cat_') && !category.id.startsWith('cat_custom_'),
    }, { onConflict: 'id' });
  } catch (err) {
    console.error('Error updating remote category:', err);
  }
}

/**
 * Deletes a custom category on Supabase
 */
export async function deleteRemoteCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('categories').delete().eq('user_id', userId).eq('id', categoryId);
  } catch (err) {
    console.error('Error deleting remote category:', err);
  }
}

/**
 * Updates user preferences on Supabase
 */
export async function updateRemotePreferences(
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from('user_preferences').upsert({
      user_id: userId,
      base_currency: prefs.baseCurrency,
      privacy_mode: prefs.privacyMode,
      theme: prefs.theme,
      is_phone_frame_view: prefs.isPhoneFrameView,
    }, { onConflict: 'user_id' });
  } catch (err) {
    console.error('Error updating remote user preferences:', err);
  }
}

