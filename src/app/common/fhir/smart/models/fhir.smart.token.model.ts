
export interface SmartToken {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
  need_patient_banner: boolean;
  patient: string;
  refresh_token?: string;
  intent?: string;
}
