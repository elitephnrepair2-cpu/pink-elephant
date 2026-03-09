export type FormType = 'tattoo' | 'piercing' | 'minor-piercing';

export interface BaseFormData {
  id: string;
  type: FormType;
  submissionDate: string;
  submissionTime: string;
  timestamp: string;
  isArchived: boolean;
  
  // Client Info
  name: string;
  date: string;
  address: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  
  // Acknowledgments
  aftercareAcknowledged: boolean;
  
  // Signatures
  signature: string;
  
  // Artist Section (To be completed by artist)
  artistName?: string;
  price?: string;
  clientAge?: string;
  clientDOB?: string;
  idType?: string;
  location?: string;
  colorsUsed?: string;
  jewelryUsed?: string;
  catalogueNumber?: string;
}

export interface MinorPiercingFormData extends BaseFormData {
  parentGuardianName: string;
  minorName: string;
  relationToMinor: string;
  minorIdPhoto: string;
  guardianIdPhoto: string;
  adultSignature: string;
  minorSignature: string;
  procedureExplanation: string;
  healingTime: string;
}
