
export type TransactionStatus = "processing" | "completed" | "failed";

export interface Transaction {
  date: string;
  type: "BRIDGE";
  from: string;
  to: string;
  fromAmount: string;
  toAmount: string;
  status: TransactionStatus;
  hash: string;
}
