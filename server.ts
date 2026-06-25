import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Pet, BiteCase, CrossBarangayAlert, AnonymousReport } from "./src/types";

// Setup storage
const DB_PATH = path.join(process.cwd(), "src", "db.json");

interface DBState {
  users: any[];
  pets: Pet[];
  biteCases: BiteCase[];
  alerts: CrossBarangayAlert[];
  anonymousReports: AnonymousReport[];
}

const DEFAULT_USERS = [
  { id: "u-admin", username: "admin", password: "123", role: "admin", name: "Dr. Maria Santos", phone: "0917-123-4567", email: "admin@irosin.gov.ph" },
  { id: "u-op-julian", username: "op_julian", password: "123", role: "operator", name: "Sec. Roberto Diaz", barangay: "San Julian", phone: "0918-765-4321", email: "julian_operator@irosin.gov.ph" },
  { id: "u-op-bacolod", username: "op_bacolod", password: "123", role: "operator", name: "Sec. Elena Cruz", barangay: "Bacolod", phone: "0919-456-7890", email: "bacolod_operator@irosin.gov.ph" },
  { id: "u-bite", username: "bite_center", password: "123", role: "bite_center", name: "Irosin Animal Bite Treatment Center", phone: "0920-111-2222", email: "bite_center@irosin.gov.ph" },
  { id: "u-clinic", username: "vet_clinic", password: "123", role: "vet_clinic", name: "Irosin Vet Clinic & Surgery", clinicName: "Irosin Veterinary Wellness", phone: "0921-333-4444", email: "vet_clinic@irosin.gov.ph" },
  { id: "u-owner", username: "owner", password: "123", role: "owner", name: "Juan Dela Cruz", barangay: "San Julian", phone: "0922-555-6666", email: "gozarinjohan87@gmail.com" }
];

const DEFAULT_PETS: Pet[] = [
  {
    id: "pet-001",
    name: "Rocky",
    classification: "Dog",
    breed: "Aspin",
    gender: "Male",
    color: "Light Brown with white patches",
    ownerId: "u-owner",
    ownerName: "Juan Dela Cruz",
    ownerPhone: "0922-555-6666",
    barangay: "San Julian",
    confinementSetup: "Leashed",
    verificationStatus: "Active",
    sightingClassification: "Local Pet",
    registeredAt: "2026-01-10",
    vaccinatedStatus: "Active",
    spayNeuterStatus: "Spayed/Neutered",
    lastVaccinatedDate: "2026-01-12",
    lastSurgicalDate: "2026-01-15",
    impounded: false,
    eligibleForAdoption: false
  },
  {
    id: "pet-002",
    name: "Miming",
    classification: "Cat",
    breed: "Domestic Shorthair",
    gender: "Female",
    color: "Calico (orange/black/white)",
    ownerId: "u-owner",
    ownerName: "Juan Dela Cruz",
    ownerPhone: "0922-555-6666",
    barangay: "San Julian",
    confinementSetup: "Unleashed/Roaming",
    verificationStatus: "Active",
    sightingClassification: "Local Pet",
    registeredAt: "2026-02-20",
    vaccinatedStatus: "Expired",
    spayNeuterStatus: "Intact",
    lastVaccinatedDate: "2025-02-15",
    impounded: false,
    eligibleForAdoption: false
  },
  {
    id: "pet-003",
    name: "Buster",
    classification: "Dog",
    breed: "Golden Retriever Mix",
    gender: "Male",
    color: "Golden Cream",
    ownerId: "guest-1",
    ownerName: "Patricia Alcantara",
    ownerPhone: "0915-222-3333",
    barangay: "Bacolod",
    confinementSetup: "Leashed",
    verificationStatus: "Pending",
    sightingClassification: "Local Pet",
    registeredAt: "2026-06-22",
    vaccinatedStatus: "Expired",
    spayNeuterStatus: "Intact",
    impounded: false,
    eligibleForAdoption: false
  },
  {
    id: "pet-004",
    name: "Stray #104",
    classification: "Dog",
    breed: "Aspin",
    gender: "Male",
    color: "Black and Tan",
    ownerId: null,
    ownerName: "N/A (Community Stray)",
    ownerPhone: "N/A",
    barangay: "Bacolod",
    confinementSetup: "Unleashed/Roaming",
    verificationStatus: "Active",
    sightingClassification: "Suspected Neighboring Barangay Stray",
    suspectedOriginBarangay: "San Julian",
    registeredAt: "2026-06-20",
    vaccinatedStatus: "Expired",
    spayNeuterStatus: "Intact",
    impounded: true,
    eligibleForAdoption: true,
    adoptionDetails: "Found roaming near Bacolod Plaza. Friendly, active male, loves company. Looking for a warm home."
  },
  {
    id: "pet-005",
    name: "Whiskers",
    classification: "Cat",
    breed: "Persian Mix",
    gender: "Female",
    color: "Fluffy Grey",
    ownerId: null,
    ownerName: "N/A (Community Stray)",
    ownerPhone: "N/A",
    barangay: "San Julian",
    confinementSetup: "Unleashed/Roaming",
    verificationStatus: "Active",
    sightingClassification: "Stray",
    registeredAt: "2026-06-15",
    vaccinatedStatus: "Active",
    spayNeuterStatus: "Spayed/Neutered",
    lastVaccinatedDate: "2026-06-16",
    lastSurgicalDate: "2026-06-16",
    impounded: true,
    eligibleForAdoption: true,
    adoptionDetails: "Beautiful fluffy grey kitten. Extremely docile, loves cuddling. Vaccinated and spayed."
  }
];

const DEFAULT_BITE_CASES: BiteCase[] = [
  {
    id: "bite-001",
    patientName: "Mark Anthony Fulo",
    patientAge: 12,
    patientGender: "Male",
    patientAddress: "Brgy. San Julian, Irosin, Sorsogon",
    contactPhone: "0955-345-6789",
    incidentDate: "2026-06-18",
    biteLocation: "Right Ankle",
    barangay: "San Julian",
    animalType: "Dog",
    petId: "pet-002", // Linked to Miming
    quarantineStatus: "Under Quarantine",
    quarantineNotes: "Bite occurred while playing. Cat Miming has been placed under standard 14-day home quarantine/observation. Expiring on July 2.",
    loggedAt: "2026-06-19"
  },
  {
    id: "bite-002",
    patientName: "Angela Lim",
    patientAge: 27,
    patientGender: "Female",
    patientAddress: "Brgy. Bacolod, Irosin, Sorsogon",
    contactPhone: "0921-999-8888",
    incidentDate: "2026-06-10",
    biteLocation: "Left Hand",
    barangay: "Bacolod",
    animalType: "Dog",
    petId: "pet-004", // Linked to Stray #104
    quarantineStatus: "Case Closed",
    quarantineNotes: "Biting stray was captured and transferred to Municipal Pound. Showed no signs of Rabies. Released for public adoption. Patient received full post-exposure prophylaxis (PEP) vaccine cycle.",
    loggedAt: "2026-06-11"
  }
];

const DEFAULT_ALERTS: CrossBarangayAlert[] = [
  {
    id: "alert-001",
    originBarangay: "Bacolod",
    targetBarangay: "San Julian",
    petId: "pet-004",
    status: "Unresolved",
    message: "A Black and Tan male dog (Stray #104) was captured in Bacolod. Form fields flag it as a suspected stray from San Julian. Please check matching registered local profiles.",
    createdAt: "2026-06-20"
  }
];

const DEFAULT_ANONYMOUS_REPORTS: AnonymousReport[] = [
  {
    id: "rep-001",
    barangay: "San Julian",
    classification: "Dog",
    color: "Dirty White, curly hair",
    confinementSetup: "Unleashed/Roaming",
    additionalTraits: "Leash dragging on ground, barking aggressively near San Julian Elementary School.",
    reportedAt: "2026-06-23",
    status: "Pending"
  }
];

// Read DB helper
function loadDB(): DBState {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Ensure folder exists
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const initialState: DBState = {
        users: DEFAULT_USERS,
        pets: DEFAULT_PETS,
        biteCases: DEFAULT_BITE_CASES,
        alerts: DEFAULT_ALERTS,
        anonymousReports: DEFAULT_ANONYMOUS_REPORTS
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialState, null, 2));
      return initialState;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(data);
    let modified = false;
    if (parsed.users && Array.isArray(parsed.users)) {
      parsed.users = parsed.users.map((u: any) => {
        if (!u.email) {
          modified = true;
          const defaultMatch = DEFAULT_USERS.find(du => du.id === u.id || du.username === u.username);
          if (defaultMatch) {
            return { ...u, email: defaultMatch.email };
          } else {
            return { ...u, email: `${u.username}@example.com` };
          }
        }
        return u;
      });
    }
    if (modified) {
      fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (error) {
    console.error("Failed to load db.json, returning default states", error);
    return {
      users: DEFAULT_USERS,
      pets: DEFAULT_PETS,
      biteCases: DEFAULT_BITE_CASES,
      alerts: DEFAULT_ALERTS,
      anonymousReports: DEFAULT_ANONYMOUS_REPORTS
    };
  }
}

// Write DB helper
function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Failed to save db.json", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple token mock logic (Session Header validation)
  function getSessionUser(req: express.Request): any {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.replace("Bearer ", "");
    
    // In our mock, the token is simply the userId
    const db = loadDB();
    return db.users.find(u => u.id === token) || null;
  }

  // --- API ROUTES ---

  // Auth APIs
  app.post("/api/auth/register", (req, res) => {
    const { username, password, name, email, barangay, phone } = req.body;
    const db = loadDB();
    if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const userEmail = email || `${username}@irosin.gov.ph`;
    if (db.users.some(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase())) {
      return res.status(400).json({ error: "Email address already registered" });
    }
    const newUser = {
      id: `u-${Date.now().toString().slice(-4)}`,
      username,
      password,
      email: userEmail,
      role: 'owner',
      name,
      barangay,
      phone
    };
    db.users.push(newUser);
    saveDB(db);
    res.status(201).json({
      token: newUser.id,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        barangay: newUser.barangay,
        phone: newUser.phone
      }
    });
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const db = loadDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    // Return the user and a mock token (their ID)
    res.json({
      token: user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name,
        barangay: user.barangay,
        phone: user.phone,
        clinicName: user.clinicName
      }
    });
  });

  // Forgot Password Initiator (with Email Simulation)
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }
    const db = loadDB();
    const user = db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "No registered account found with that email address." });
    }

    // Generate secure token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = Date.now() + 3600000; // 1 hour expiration

    user.resetToken = token;
    user.resetTokenExpires = expires;

    const userIndex = db.users.findIndex(u => u.id === user.id);
    db.users[userIndex] = user;
    saveDB(db);

    const simulatedSubject = "🔐 Irosin Pet Registry - Secure Password Reset Link";
    const simulatedBody = `Hi ${user.name},\n\nYou requested to reset your password for the Web-Based Pet Registry & Monitoring System of Irosin, Sorsogon.\n\nPlease copy this security token or click the direct verification reset link below to update your credentials:\n\nVerification Token: ${token}\n\nDirect Reset Link:\nhttps://${req.get('host') || 'localhost:3000'}/?resetToken=${token}\n\nThis secure verification link is valid for 1 hour. If you did not initiate this request, please ignore this email.\n\nWarm regards,\nMunicipal Agriculture Office & Public Safety Section\nIrosin, Sorsogon`;

    console.log(`\n======================================================================`);
    console.log(`[EMAIL VERIFICATION SENT - PASSWORD RESET]`);
    console.log(`To: ${user.email}`);
    console.log(`Subject: ${simulatedSubject}`);
    console.log(`Body:\n${simulatedBody}`);
    console.log(`======================================================================\n`);

    res.json({
      success: true,
      message: "Security code verification has been sent. Please check your simulated verification inbox.",
      _devSimulatedEmail: {
        to: user.email,
        subject: simulatedSubject,
        body: simulatedBody,
        token: token
      }
    });
  });

  // Secure Password Reset Update
  app.post("/api/auth/reset-password", (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required." });
    }
    const db = loadDB();
    const user = db.users.find(u => u.resetToken === token && u.resetTokenExpires && u.resetTokenExpires > Date.now());
    if (!user) {
      return res.status(400).json({ error: "The password reset token is invalid or has expired. Please initiate another request." });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;

    const userIndex = db.users.findIndex(u => u.id === user.id);
    db.users[userIndex] = user;
    saveDB(db);

    res.json({
      success: true,
      message: "Credentials successfully updated! You may now sign in using your new password."
    });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized or invalid session" });
    }
    res.json({ user });
  });

  // Pets APIs
  app.get("/api/pets", (req, res) => {
    const db = loadDB();
    let result = [...db.pets];

    // Optional query filters
    const { barangay, verificationStatus, confinementSetup, impounded, eligibleForAdoption } = req.query;

    if (barangay) {
      result = result.filter(p => p.barangay.toLowerCase() === (barangay as string).toLowerCase());
    }
    if (verificationStatus) {
      result = result.filter(p => p.verificationStatus === verificationStatus);
    }
    if (confinementSetup) {
      result = result.filter(p => p.confinementSetup === confinementSetup);
    }
    if (impounded !== undefined) {
      result = result.filter(p => p.impounded === (impounded === "true"));
    }
    if (eligibleForAdoption !== undefined) {
      result = result.filter(p => p.eligibleForAdoption === (eligibleForAdoption === "true"));
    }

    res.json(result);
  });

  app.get("/api/pets/:id", (req, res) => {
    const db = loadDB();
    const pet = db.pets.find(p => p.id === req.params.id);
    if (!pet) {
      return res.status(404).json({ error: "Pet not found" });
    }
    res.json(pet);
  });

  app.post("/api/pets", (req, res) => {
    const user = getSessionUser(req);
    const petData = req.body;
    const db = loadDB();

    // Create a new ID
    const newId = `pet-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;

    // Set defaults based on role
    let verificationStatus: 'Pending' | 'Active' = 'Pending';
    let ownerId = petData.ownerId || null;

    if (user) {
      // If a BHW / Operator logs it directly, or an admin, set to Active
      if (user.role === 'operator' || user.role === 'admin') {
        verificationStatus = 'Active';
      } else if (user.role === 'owner') {
        ownerId = user.id;
      }
    }

    const newPet: Pet = {
      id: newId,
      name: petData.name || `Stray ${petData.classification} #${newId.split("-")[1]}`,
      classification: petData.classification || 'Dog',
      breed: petData.breed || 'Unknown / Mixed',
      gender: petData.gender || 'Male',
      color: petData.color || 'Unspecified color',
      ownerId: ownerId,
      ownerName: petData.ownerName || (user?.role === 'owner' ? user.name : 'N/A (Community Stray)'),
      ownerPhone: petData.ownerPhone || (user?.role === 'owner' ? user.phone : 'N/A'),
      barangay: petData.barangay || user?.barangay || 'San Julian',
      confinementSetup: petData.confinementSetup || 'Leashed',
      verificationStatus: verificationStatus,
      sightingClassification: petData.sightingClassification || 'Local Pet',
      suspectedOriginBarangay: petData.suspectedOriginBarangay,
      registeredAt: new Date().toISOString().split('T')[0],
      vaccinatedStatus: petData.vaccinatedStatus || 'Expired',
      spayNeuterStatus: petData.spayNeuterStatus || 'Intact',
      lastVaccinatedDate: petData.lastVaccinatedDate,
      lastSurgicalDate: petData.lastSurgicalDate,
      impounded: petData.impounded || false,
      eligibleForAdoption: petData.eligibleForAdoption || false,
      adoptionDetails: petData.adoptionDetails,
      photoUrl: petData.photoUrl || ''
    };

    db.pets.push(newPet);

    // If "Suspected Neighboring Barangay Stray" is flagged, push a background cross-reference alert!
    if (newPet.sightingClassification === 'Suspected Neighboring Barangay Stray' && newPet.suspectedOriginBarangay) {
      const alertId = `alert-${Date.now().toString().slice(-4)}`;
      const newAlert: CrossBarangayAlert = {
        id: alertId,
        originBarangay: newPet.barangay,
        targetBarangay: newPet.suspectedOriginBarangay,
        petId: newPet.id,
        status: 'Unresolved',
        message: `An un-collared ${newPet.color} ${newPet.classification} (${newPet.breed}) was logged in Brgy. ${newPet.barangay}. Designated as a suspected stray originating from Brgy. ${newPet.suspectedOriginBarangay}. Please cross-reference profiles.`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      db.alerts.push(newAlert);
    }

    saveDB(db);
    res.status(201).json(newPet);
  });

  app.post("/api/pets/sync", (req, res) => {
    const user = getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized. Valid session token required for synchronization." });
    }

    const { pets } = req.body;
    const batch = Array.isArray(pets) ? pets : (Array.isArray(req.body) ? req.body : null);

    if (!batch) {
      return res.status(400).json({ error: "Invalid payload. Expected an array of pet registrations." });
    }

    const db = loadDB();
    const syncedPets: any[] = [];
    const errors: string[] = [];

    for (const petData of batch) {
      if (!petData.name && !petData.classification) {
        errors.push(`Record skipped: Missing name and classification fields.`);
        continue;
      }

      const newId = `pet-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;

      let verificationStatus: 'Pending' | 'Active' = 'Pending';
      let ownerId = petData.ownerId || null;

      if (user.role === 'operator' || user.role === 'admin') {
        verificationStatus = 'Active';
      } else if (user.role === 'owner') {
        ownerId = user.id;
      }

      const newPet = {
        id: newId,
        name: petData.name || `Stray ${petData.classification || 'Dog'} #${newId.split("-")[1]}`,
        classification: petData.classification || 'Dog',
        breed: petData.breed || 'Unknown / Mixed',
        gender: petData.gender || 'Male',
        color: petData.color || 'Unspecified color',
        ownerId: ownerId,
        ownerName: petData.ownerName || (user.role === 'owner' ? user.name : 'N/A (Community Stray)'),
        ownerPhone: petData.ownerPhone || (user.role === 'owner' ? user.phone : 'N/A'),
        barangay: petData.barangay || user.barangay || 'San Julian',
        confinementSetup: petData.confinementSetup || 'Leashed',
        verificationStatus: verificationStatus,
        sightingClassification: petData.sightingClassification || 'Local Pet',
        suspectedOriginBarangay: petData.suspectedOriginBarangay,
        registeredAt: petData.registeredAt || new Date().toISOString().split('T')[0],
        vaccinatedStatus: petData.vaccinatedStatus || 'Expired',
        spayNeuterStatus: petData.spayNeuterStatus || 'Intact',
        lastVaccinatedDate: petData.lastVaccinatedDate,
        lastSurgicalDate: petData.lastSurgicalDate,
        impounded: petData.impounded || false,
        eligibleForAdoption: petData.eligibleForAdoption || false,
        adoptionDetails: petData.adoptionDetails,
        photoUrl: petData.photoUrl || ''
      };

      db.pets.push(newPet);
      syncedPets.push(newPet);

      if (newPet.sightingClassification === 'Suspected Neighboring Barangay Stray' && newPet.suspectedOriginBarangay) {
        const alertId = `alert-${Date.now().toString().slice(-4)}`;
        const newAlert: CrossBarangayAlert = {
          id: alertId,
          originBarangay: newPet.barangay,
          targetBarangay: newPet.suspectedOriginBarangay,
          petId: newPet.id,
          status: 'Unresolved',
          message: `An un-collared ${newPet.color} ${newPet.classification} (${newPet.breed}) was logged in Brgy. ${newPet.barangay} during offline sync. Designated as a suspected stray originating from Brgy. ${newPet.suspectedOriginBarangay}. Please cross-reference profiles.`,
          createdAt: new Date().toISOString().split('T')[0]
        };
        db.alerts.push(newAlert);
      }
    }

    saveDB(db);

    res.status(201).json({
      message: `Successfully synchronized ${syncedPets.length} pet records.`,
      count: syncedPets.length,
      synced: syncedPets,
      errors: errors.length > 0 ? errors : undefined
    });
  });

  app.put("/api/pets/:id", (req, res) => {
    const db = loadDB();
    const index = db.pets.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Pet not found" });
    }

    const updatedPet = { ...db.pets[index], ...req.body };
    db.pets[index] = updatedPet;
    saveDB(db);
    res.json(updatedPet);
  });

  // Verify route for Barangay Operator / BHW
  app.put("/api/pets/:id/verify", (req, res) => {
    const user = getSessionUser(req);
    if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized. Operator privilege required." });
    }

    const db = loadDB();
    const index = db.pets.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Pet not found" });
    }

    db.pets[index].verificationStatus = 'Active';
    saveDB(db);
    res.json(db.pets[index]);
  });

  // Update vaccination (Clinic or Admin)
  app.put("/api/pets/:id/vaccination", (req, res) => {
    const user = getSessionUser(req);
    if (!user || (user.role !== 'vet_clinic' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized. Medical logging authorization required." });
    }

    const { date, status } = req.body;
    const db = loadDB();
    const index = db.pets.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Pet not found" });
    }

    db.pets[index].vaccinatedStatus = status || 'Active';
    db.pets[index].lastVaccinatedDate = date || new Date().toISOString().split('T')[0];
    saveDB(db);
    res.json(db.pets[index]);
  });

  // Update surgical logs (Clinic or Admin)
  app.put("/api/pets/:id/surgical", (req, res) => {
    const user = getSessionUser(req);
    if (!user || (user.role !== 'vet_clinic' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized. Medical logging authorization required." });
    }

    const { status, date } = req.body;
    const db = loadDB();
    const index = db.pets.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Pet not found" });
    }

    db.pets[index].spayNeuterStatus = status || 'Spayed/Neutered';
    db.pets[index].lastSurgicalDate = date || new Date().toISOString().split('T')[0];
    saveDB(db);
    res.json(db.pets[index]);
  });

  // Admin Pound control
  app.put("/api/pets/:id/pound", (req, res) => {
    const user = getSessionUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: "Unauthorized. Municipal Admin access required." });
    }

    const { impounded, eligibleForAdoption, adoptionDetails } = req.body;
    const db = loadDB();
    const index = db.pets.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Pet not found" });
    }

    if (impounded !== undefined) db.pets[index].impounded = impounded;
    if (eligibleForAdoption !== undefined) db.pets[index].eligibleForAdoption = eligibleForAdoption;
    if (adoptionDetails !== undefined) db.pets[index].adoptionDetails = adoptionDetails;

    saveDB(db);
    res.json(db.pets[index]);
  });

  // Bite Cases APIs
  app.get("/api/bite-cases", (req, res) => {
    const db = loadDB();
    res.json(db.biteCases);
  });

  app.post("/api/bite-cases", (req, res) => {
    const user = getSessionUser(req);
    if (!user || (user.role !== 'bite_center' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized. Bite Center access required." });
    }

    const caseData = req.body;
    const db = loadDB();
    const newId = `bite-${Date.now().toString().slice(-4)}`;

    const initialStatus = caseData.quarantineStatus || 'Pending Action';
    const newCase: BiteCase = {
      id: newId,
      patientName: caseData.patientName,
      patientAge: Number(caseData.patientAge) || 0,
      patientGender: caseData.patientGender || 'Male',
      patientAddress: caseData.patientAddress || 'Irosin, Sorsogon',
      contactPhone: caseData.contactPhone || 'N/A',
      incidentDate: caseData.incidentDate || new Date().toISOString().split('T')[0],
      biteLocation: caseData.biteLocation || 'Lower Extremity',
      barangay: caseData.barangay || 'San Julian',
      animalType: caseData.animalType || 'Dog',
      petId: caseData.petId || null,
      quarantineStatus: initialStatus,
      quarantineNotes: caseData.quarantineNotes || 'No quarantine logs uploaded yet.',
      loggedAt: new Date().toISOString().split('T')[0],
      statusHistory: [
        {
          status: initialStatus,
          notes: caseData.quarantineNotes || 'Bite incident logged, awaiting formal observation.',
          updatedBy: user.name,
          updatedAt: new Date().toISOString()
        }
      ]
    };

    db.biteCases.push(newCase);
    saveDB(db);
    res.status(201).json(newCase);
  });

  app.put("/api/bite-cases/:id/status", (req, res) => {
    const user = getSessionUser(req);
    if (!user || (user.role !== 'bite_center' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized. Bite Center or Admin privileges required." });
    }

    const { quarantineStatus, quarantineNotes } = req.body;
    const db = loadDB();
    const index = db.biteCases.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Bite case not found" });
    }

    const currentCase = db.biteCases[index];
    if (!currentCase.statusHistory) {
      currentCase.statusHistory = [
        {
          status: 'Pending Action',
          notes: currentCase.quarantineNotes || 'No quarantine logs uploaded yet.',
          updatedBy: 'System Init',
          updatedAt: currentCase.loggedAt + 'T12:00:00.000Z'
        }
      ];
    }

    if (quarantineStatus) currentCase.quarantineStatus = quarantineStatus;
    if (quarantineNotes) currentCase.quarantineNotes = quarantineNotes;

    currentCase.statusHistory.push({
      status: quarantineStatus || currentCase.quarantineStatus,
      notes: quarantineNotes || currentCase.quarantineNotes,
      updatedBy: user.name,
      updatedAt: new Date().toISOString()
    });

    saveDB(db);
    res.json(currentCase);
  });

  // Alerts APIs
  app.get("/api/alerts", (req, res) => {
    const db = loadDB();
    res.json(db.alerts);
  });

  app.put("/api/alerts/:id/resolve", (req, res) => {
    const user = getSessionUser(req);
    if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const { status } = req.body;
    const db = loadDB();
    const index = db.alerts.findIndex(a => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Alert not found" });
    }

    db.alerts[index].status = status || 'Identified';
    saveDB(db);
    res.json(db.alerts[index]);
  });

  // Anonymous Reports APIs
  app.get("/api/anonymous-reports", (req, res) => {
    const db = loadDB();
    res.json(db.anonymousReports);
  });

  app.post("/api/anonymous-reports", (req, res) => {
    const reportData = req.body;
    const db = loadDB();
    const newId = `rep-${Date.now().toString().slice(-4)}`;

    const newReport: AnonymousReport = {
      id: newId,
      barangay: reportData.barangay || 'San Julian',
      classification: reportData.classification || 'Dog',
      color: reportData.color || 'Unspecified Color',
      confinementSetup: reportData.confinementSetup || 'Unleashed/Roaming',
      additionalTraits: reportData.additionalTraits || 'No additional details provided.',
      reportedAt: new Date().toISOString().split('T')[0],
      status: 'Pending',
      photoUrl: reportData.photoUrl || ''
    };

    db.anonymousReports.push(newReport);
    saveDB(db);
    res.status(201).json(newReport);
  });

  app.put("/api/anonymous-reports/:id/review", (req, res) => {
    const user = getSessionUser(req);
    if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const db = loadDB();
    const index = db.anonymousReports.findIndex(r => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Report not found" });
    }

    db.anonymousReports[index].status = 'Reviewed';
    saveDB(db);
    res.json(db.anonymousReports[index]);
  });

  // Admin Analytics API
  app.get("/api/analytics", (req, res) => {
    const db = loadDB();
    
    // 1. Hotspots by barangay (Combined count of loose animals + human bite cases)
    const hotspotsMap: Record<string, { bites: number; roaming: number; total: number }> = {};
    
    db.biteCases.forEach(b => {
      if (!hotspotsMap[b.barangay]) {
        hotspotsMap[b.barangay] = { bites: 0, roaming: 0, total: 0 };
      }
      hotspotsMap[b.barangay].bites += 1;
      hotspotsMap[b.barangay].total += 1;
    });

    db.pets.forEach(p => {
      if (p.confinementSetup === 'Unleashed/Roaming') {
        if (!hotspotsMap[p.barangay]) {
          hotspotsMap[p.barangay] = { bites: 0, roaming: 0, total: 0 };
        }
        hotspotsMap[p.barangay].roaming += 1;
        hotspotsMap[p.barangay].total += 1;
      }
    });

    const hotspots = Object.entries(hotspotsMap).map(([barangay, counts]) => ({
      barangay,
      ...counts
    })).sort((a, b) => b.total - a.total);

    // 2. Leash Compliance metrics
    let leashedCount = 0;
    let unleashedCount = 0;
    db.pets.forEach(p => {
      if (p.confinementSetup === 'Leashed') leashedCount++;
      else unleashedCount++;
    });

    // 3. Vaccination metrics (Active vs Expired)
    let vaccinatedActive = 0;
    let vaccinatedExpired = 0;
    db.pets.forEach(p => {
      if (p.vaccinatedStatus === 'Active') vaccinatedActive++;
      else vaccinatedExpired++;
    });

    // 4. Pound indicators
    const totalImpounded = db.pets.filter(p => p.impounded).length;
    const totalAdoptionEligible = db.pets.filter(p => p.eligibleForAdoption).length;

    // 5. Vaccination trend over registration months
    const regMonths: Record<string, { count: number }> = {};
    db.pets.forEach(p => {
      // Group by registeredAt's month (YYYY-MM)
      const month = p.registeredAt.substring(0, 7) || "2026-06";
      if (!regMonths[month]) regMonths[month] = { count: 0 };
      regMonths[month].count += 1;
    });
    const registrationTrend = Object.entries(regMonths).map(([month, data]) => ({
      month,
      registered: data.count
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      hotspots,
      compliance: {
        leashed: leashedCount,
        unleashed: unleashedCount,
        total: leashedCount + unleashedCount
      },
      vaccination: {
        active: vaccinatedActive,
        expired: vaccinatedExpired,
        total: vaccinatedActive + vaccinatedExpired
      },
      pound: {
        impounded: totalImpounded,
        adoptionEligible: totalAdoptionEligible
      },
      registrationTrend
    });
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
