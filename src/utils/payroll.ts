import { WorkerData, PayrollCalculation } from '../types';

export function calculatePayroll(data: WorkerData): PayrollCalculation {
  // Remuneração base (Calculado apenas nas horas trabalhadas)
  const basePay = data.hoursWorked * data.hourlyRate;
  
  // Ajudas de Custo (Diárias) - 100% não tributável segundo o pedido do utilizador
  const totalAllowances = data.dailyAllowance * data.daysWorked;
  const taxFreeAllowances = totalAllowances;
  const taxableAllowances = 0;
  
  // Subsídios (Mensais)
  const holidaySubsidyValue = data.monthlyHolidaySubsidy;
  const christmasSubsidyValue = data.monthlyChristmasSubsidy;
  
  // Rendimento Tributável (O utilizador pediu para o cálculo de impostos incidir apenas nas horas trabalhadas e, se aplicável, noutros rendimentos que não diárias)
  // Como o pedido diz "Tenha certeza que o calculo é feito somente nas horas trabalhadas", vamos focar a base de imposto na remuneração base (horas * taxa),
  // mas mantendo subsdios e bonus se os houver, embora diárias sejam 0% tributáveis.
  const taxableIncome = basePay + data.seniority + data.bonuses + holidaySubsidyValue + christmasSubsidyValue;
  
  // Rendimento Não Tributável
  const taxFreeIncome = taxFreeAllowances + data.expenses;
  
  // Remuneração Bruta
  const grossSalary = taxableIncome + taxFreeIncome;
  
  // Segurança Social (11% a cargo do trabalhador sobre a base tributável)
  const socialSecurity = taxableIncome * 0.11;
  
  // Simulação de Retenção na Fonte de IRS
  // Nota: Estas são taxas simplificadas para efeitos de protótipo.
  let irsRate = 0.15; // taxa base 15%
  
  if (data.maritalStatus === 'Casado (Único Titular)') irsRate -= 0.02; // Menos retenção
  if (data.dependents > 0) irsRate -= (data.dependents * 0.015); // Menos retenção por dependente
  if (data.hasDisability) irsRate -= 0.03; // Benefício por deficiência
  
  if (data.taxRegime === 'IRS Jovem') {
    irsRate *= 0.5; // Redução simplificada do IRS Jovem
  } else if (data.taxRegime === 'RNH') {
    irsRate = 0.20; // Taxa fixa RNH 20%
  }
  
  // Garantir que a taxa não é negativa
  irsRate = Math.max(0, irsRate); 
  
  const irsRetention = taxableIncome * irsRate;
  
  // Salário Líquido
  const netSalary = grossSalary - socialSecurity - irsRetention;
  
  return {
    basePay,
    grossSalary,
    taxableIncome,
    taxFreeIncome,
    irsRetention,
    socialSecurity,
    netSalary,
    totalAllowances,
    holidaySubsidyValue,
    christmasSubsidyValue,
  };
}
