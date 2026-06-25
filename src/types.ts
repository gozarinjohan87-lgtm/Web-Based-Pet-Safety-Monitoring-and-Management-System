export type UserRole = 'admin' | 'operator' | 'bite_center' | 'vet_clinic' | 'owner';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  name: string;
  barangay?: string; // For operator or owner
  phone?: string;
  clinicName?: string; // For private vet clinic
}

export interface Pet {
  id: string;
  name: string; // If stray, can be "Stray Dog #101"
  classification: 'Dog' | 'Cat';
  breed: string;
  gender: 'Male' | 'Female';
  color: string;
  ownerId: string | null; // null for unowned strays
  ownerName: string; // "N/A" or owner name
  ownerPhone: string;
  barangay: string; // Irosin's 20 barangays
  confinementSetup: 'Leashed' | 'Unleashed/Roaming';
  verificationStatus: 'Pending' | 'Active';
  sightingClassification: 'Local Pet' | 'Stray' | 'Suspected Neighboring Barangay Stray';
  suspectedOriginBarangay?: string;
  registeredAt: string;
  vaccinatedStatus: 'Active' | 'Expired';
  spayNeuterStatus: 'Spayed/Neutered' | 'Intact';
  lastVaccinatedDate?: string;
  lastSurgicalDate?: string;
  impounded: boolean;
  eligibleForAdoption: boolean;
  adoptionDetails?: string;
  photoUrl?: string; // visual trait support
}

export interface StatusHistoryEntry {
  status: 'Pending Action' | 'Under Quarantine' | 'Case Closed';
  notes: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BiteCase {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientAddress: string;
  contactPhone: string;
  incidentDate: string;
  biteLocation: string; // e.g. "Left Arm", "Right Leg"
  barangay: string; // 20 barangays of Irosin
  animalType: 'Dog' | 'Cat';
  petId?: string | null; // linked pet if known
  quarantineStatus: 'Pending Action' | 'Under Quarantine' | 'Case Closed';
  quarantineNotes: string;
  loggedAt: string;
  statusHistory?: StatusHistoryEntry[];
}

export interface CrossBarangayAlert {
  id: string;
  originBarangay: string;
  targetBarangay: string;
  petId: string;
  status: 'Unresolved' | 'Identified' | 'Archived';
  message: string;
  createdAt: string;
}

export interface AnonymousReport {
  id: string;
  barangay: string;
  classification: 'Dog' | 'Cat';
  color: string;
  confinementSetup: 'Leashed' | 'Unleashed/Roaming';
  additionalTraits: string;
  reportedAt: string;
  status: 'Pending' | 'Reviewed';
  photoUrl?: string;
}

export const IROSIN_BARANGAYS = [
  'Bacolod',
  'Bagong San Roque',
  'Balanac',
  'Balogo',
  'Batas',
  'Bolos',
  'Buenavista',
  'Bulwan',
  'Carriedo',
  'Casini',
  'Cawayan',
  'Gabao',
  'Gulang-gulang',
  'Gumapia',
  'Macawayan',
  'Mapaso',
  'Monbon',
  'Patag',
  'Salvacion',
  'San Agustin',
  'San Francisco',
  'San Isidro',
  'San Juan',
  'San Julian',
  'San Pedro',
  'Santo Domingo',
  'Tabon-tabon',
  'Tinampo'
];
