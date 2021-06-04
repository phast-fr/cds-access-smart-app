// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

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
  client_id: {
    prescription: '9ffb662a-79f1-4ab0-aa10-4dec5ecf87f9',
    formulary: 'f33dcd65-57d8-4192-8e18-7ec1ebd45622'
  },
  scope: {
    prescription: 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*',
    formulary: 'online_access profile openid fhirUser launch user/*.*'
  },
  display_language: 'fr-FR',
  cds_hooks_url: 'https://localhost:8443/cqf-ruler-r4',
  cio_dc_url: 'https://jade.phast.fr/resources-server/api/FHIR',
  cio_dc_credential: 'ZGF2aWQub3VhZ25lQHBoYXN0LmZyOjIncU1oa21+WFojdnpW',
  tio_url: 'https://jade.phast.fr/resources-server/api/FHIR',
  tio_credential: 'ZGF2aWQub3VhZ25lQHBoYXN0LmZyOjIncU1oa21+WFojdnpW',
  drug_formulary_resource_type: 'MedicationKnowledge'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
