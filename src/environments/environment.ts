// `.env.ts` is generated by the `npm run env` command
// `npm run env` exposes environment variables as JSON for any usage you might
// want, like displaying the version or getting extra config from your CI bot, etc.
// This is useful for granularity you might need beyond just the environment.
// Note that as usual, any environment variables you expose through it will end up in your
// bundle, and you should not use it for any sensitive information like passwords or keys.
import {npm} from './.env';

/**
 * Scope list
 *
 * smart/orchestrate_launch
 * launch
 * launch/patient
 * launch/encounter
 * launch/location
 * openid
 * profile
 * offline_access
 * online_access
 * fhirUser
 * user/*.*
 * user/*.read
 * user/*.write
 * user/AdverseReaction.read
 * user/AdverseReaction.write
 * user/Alert.read
 * user/Alert.write
 * user/AllergyIntolerance.read
 * user/AllergyIntolerance.write
 * user/Condition.read
 * user/Condition.write
 * user/Encounter.read
 * user/Encounter.write
 * user/FamilyHistory.read
 * user/FamilyHistory.write
 * user/Immunization.read
 * user/Immunization.write
 * user/Medication.read
 * user/Medication.write
 * user/MedicationOrder.read
 * user/MedicationOrder.write
 * user/MedicationPrescription.read"
 * user/MedicationPrescription.write"
 * user/MedicationStatement.read"
 * user/MedicationStatement.write"
 * user/Observation.read"
 * user/Observation.write"
 * user/Patient.read"
 * user/Patient.write"
 * user/Substance.read"
 * user/Substance.write"
 * patient/*.*
 * patient/*.read"
 * patient/*.write"
 * patient/AdverseReaction.read"
 * patient/AdverseReaction.write"
 * patient/Alert.read"
 * patient/Alert.write"
 * patient/AllergyIntolerance.read"
 * patient/AllergyIntolerance.write"
 * patient/Condition.read"
 * patient/Condition.write"
 * patient/DocumentReference.read"
 * patient/DocumentReference.write"
 * patient/Encounter.read"
 * patient/Encounter.write"
 * patient/FamilyHistory.read"
 * patient/FamilyHistory.write"
 * patient/Immunization.read"
 * patient/Immunization.write"
 * patient/MedicationOrder.read"
 * patient/MedicationOrder.write"
 * patient/MedicationPrescription.read"
 * patient/MedicationPrescription.write"
 * patient/MedicationStatement.read"
 * patient/MedicationStatement.write"
 * patient/Observation.read"
 * patient/Observation.write"
 * patient/Patient.read"
 * patient/Patient.write"
 * system/*.read"
 * system/*.write"
 */

export const environment = {
  production: false,
  version: npm.npm_package_version,
  client_id: window['env']['client_id'] || '',
  scope: {
    prescription: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    formulary: 'online_access profile openid fhirUser launch user/*.*',
    dispense: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    cqleditor: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*'
  },
  display_language: 'fr-FR',
  cds_hooks_url: 'http://localhost:9200',
  cio_dc_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  cio_dc_credential: window['env']['cio_dc_credential'] || '',
  tio_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  tio_credential: window['env']['tio_credential'] || '',
  cql_service_url: 'http://localhost:9205/r4/fhir',
  cql_library_url: 'https://recette.phast.fr/resources-server_Atelier/api/FHIR',
  cql_library_auth: true,
  cql_library_credential: window['env']['cql_library_credential'] || '',
  fhir_date_short_format: 'yyyy-MM-dd\'T\'HH:mm:00',
  fhir_date_format: 'yyyy-MM-dd\'T\'HH:mm:ss',
  display_date_format: 'dd/MM/yyyy HH:mm',
  drug_formulary_resource_type: 'MedicationKnowledge',
  override_iss: window['env']['override_iss'] || false,
  overridden_iss: window['env']['overridden_iss'] || ''
};
