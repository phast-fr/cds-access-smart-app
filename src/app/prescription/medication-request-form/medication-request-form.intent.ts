import {fhir} from '../../common/fhir/fhir.types';
import MedicationKnowledge = fhir.MedicationKnowledge;
import id = fhir.id;
import CodeableConcept = fhir.CodeableConcept;
import MedicationIngredient = fhir.MedicationIngredient;
import Dosage = fhir.Dosage;
import MedicationRequestDispenseRequest = fhir.MedicationRequestDispenseRequest;

export interface IIntent {
  readonly type: string;
}

export class MedicationFormIntentAddMedicationRequest implements IIntent {
  readonly type = 'AddMedicationRequest';

  constructor() { }
}

export class MedicationFormIntentAddMedication implements IIntent {
  readonly type = 'AddMedication';

  constructor(private _medicationKnowledge: MedicationKnowledge) { }

  public get medicationKnowledge(): MedicationKnowledge {
    return this._medicationKnowledge;
  }
}

export class MedicationFormIntentRemoveMedication implements IIntent {
  readonly type = 'RemoveMedication';

  constructor(private _nMedication: number) { }

  public get nMedication(): number {
    return this._nMedication;
  }
}

export class MedicationFormIntentAddDosageInstruction implements IIntent {
  readonly type = 'AddDosageInstruction';

  constructor() { }
}

export class MedicationFormIntentRemoveDosageInstruction implements IIntent {
  readonly type = 'RemoveDosageInstruction';

  constructor(private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentDetailsMedication implements IIntent {
  readonly type = 'DetailsMedication';

  constructor(private _medicationId: id,
              private _formCode: CodeableConcept,
              private _ingredient: MedicationIngredient[],
              private _routeCode: CodeableConcept) { }

  public get id(): id {
    return this._medicationId;
  }

  public get formCode(): CodeableConcept {
    return this._formCode;
  }

  public get ingredient(): MedicationIngredient[] {
    return this._ingredient;
  }

  public get routeCode(): CodeableConcept {
    return this._routeCode;
  }
}

export class MedicationFormIntentValueChangesDispenseRequest implements IIntent {
  readonly type = 'ValueChangesDispenseRequest';

  constructor(private _value: MedicationRequestDispenseRequest) { }

  public get value(): MedicationRequestDispenseRequest {
    return this._value;
  }
}

export class MedicationFormIntentValueChangesDosageInstruction implements IIntent {
  readonly type = 'ValueChangesDosageInstruction';

  constructor(
    private _nDosage: number,
    private _value: Dosage) { }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get value(): Dosage {
    return this._value;
  }
}

export class MedicationFormIntentAddTimeOfDay implements IIntent {
  readonly type = 'AddTimeOfDay';

  constructor(
    private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentRemoveTimeOfDay implements IIntent {
  readonly type = 'RemoveTimeOfDay';

  constructor(private _nDosage: number,
              private _index: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get index(): number {
    return this._index;
  }
}

export class MedicationFormIntentAddDoseAndRate implements IIntent {
  readonly type = 'AddDoseAndRate';

  constructor(
    private _nDosage: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }
}

export class MedicationFormIntentRemoveDoseAndRate implements IIntent {
  readonly type = 'RemoveDoseAndRate';

  constructor(private _nDosage: number,
              private _index: number) { }

  public get nDosage(): number {
    return this._nDosage;
  }

  public get index(): number {
    return this._index;
  }
}
