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
export const credential = {
  client_id: new Map<string, string>([
    ['prescription', 'TODO put here your client_id'],
    ['formulary', 'TODO put here your client_id'],
    ['dispense', 'TODO put here your client_id']
  ]),
  scope: new Map<string, string>([
    ['prescription', 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*'],
    ['formulary', 'online_access profile openid fhirUser launch user/*.*'],
    ['dispense', 'online_access profile openid fhirUser launch launch/user user/*.* patient/*.*']
  ]),
  cio_dc_credential: 'TODO put here your CIOdc credentials',
  tio_credential: 'ZGF2aWQub3VhZ25lQHBoYXN0LmZyOjIncU1oa21+WFojdnpW'
};
