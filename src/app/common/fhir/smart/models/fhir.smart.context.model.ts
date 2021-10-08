
export interface SmartContext {
  iss: string;
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
  patient: string;
  need_patient_banner: boolean;
  refresh_token?: string;
  intent?: string;
}
