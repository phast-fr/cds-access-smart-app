// `.env.ts` is generated by the `npm run env` command
// `npm run env` exposes environment variables as JSON for any usage you might
// want, like displaying the version or getting extra config from your CI bot, etc.
// This is useful for granularity you might need beyond just the environment.
// Note that as usual, any environment variables you expose through it will end up in your
// bundle, and you should not use it for any sensitive information like passwords or keys.
import {env} from './.env';
import {credential} from './credential.prod';

export const environment = {
  production: true,
  version: env.npm_package_version,
  client_id: credential.client_id,
  scope: {
    prescription: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    formulary: 'online_access profile openid fhirUser launch user/*.*',
    dispense: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    'cql-editor': 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*'
  },
  display_language: 'fr-FR',
  cds_hooks_url: 'https://cds-access.phast.fr:8443/cql-cds-hooks',
  cio_dc_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  cio_dc_credential: credential.cio_dc_credential,
  tio_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  tio_credential: credential.tio_credential,
  cql_service_url: 'https://cds-access.phast.fr:8443/cql-proxy/r4/fhir',
  fhir_date_short_format: 'yyyy-MM-dd\'T\'HH:mm:00',
  fhir_date_format: 'yyyy-MM-dd\'T\'HH:mm:ss',
  display_date_format: 'dd/MM/yyyy HH:mm',
  drug_formulary_resource_type: 'MedicationKnowledge'
};
