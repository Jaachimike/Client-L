/** Invented rows in the same layout as an Inflow/Outflow sheet export, for tests and demos. */
export const SAMPLE_CSV = [
  'Descriptioon,Inflow,Outflow,Project Name,Date (DD/MM/YY),Comments',
  'Website build deposit,500000,,Acme Foods,14/02/2026,',
  'Designer UI Cost,,120000,Acme Foods,20/02/2026,',
  'Backend Dev Cost,,80000,Acme Foods,,',
  '"Balance, final 60%",750000,,Beta Clinic,03/03/2026," (received 700000, 50000 removed for VAT)"',
  'Hosting refund,,,Beta Clinic,05/03/2026,',
  'Odd amount,lots,,Beta Clinic,06/03/2026,',
  'Bad date,1000,,Beta Clinic,31/02/2026,',
  ',,,,,',
  'TOTAL INFLOW,1250000,,,,',
  'TOTAL OUTFLOW,,200000,,,',
].join('\r\n');
