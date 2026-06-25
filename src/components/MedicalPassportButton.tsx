import React from 'react';
import { FileText, Printer, ShieldCheck } from 'lucide-react';
import { Pet } from '../types';

interface MedicalPassportButtonProps {
  pet: Pet;
  variant?: 'primary' | 'outline' | 'compact';
}

export default function MedicalPassportButton({ pet, variant = 'primary' }: MedicalPassportButtonProps) {
  const handlePrint = () => {
    // Generate QR Code URL for the printed passport using a public high-fidelity rendering API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(pet.id)}`;
    
    // Calculate recommended booster date
    let boosterDate = 'Pending First Inoculation';
    if (pet.lastVaccinatedDate) {
      try {
        const lastVac = new Date(pet.lastVaccinatedDate);
        lastVac.setFullYear(lastVac.getFullYear() + 1);
        boosterDate = lastVac.toISOString().split('T')[0];
      } catch {
        boosterDate = '1 Year post-inoculation';
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing the printable Medical Passport from opening. Please enable pop-ups for this domain.');
      return;
    }

    // Write pristine, print-styled document matching the requested dominant White and Warm Yellow visual guidelines.
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medical Passport - ${pet.name}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1c1917;
              background-color: #ffffff;
              margin: 0;
              padding: 40px;
              line-height: 1.5;
            }

            .badge {
              display: inline-block;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 4px 10px;
              border-radius: 6px;
              margin-bottom: 10px;
            }

            .badge-active {
              background-color: #ecfdf5;
              color: #065f46;
              border: 1px solid #a7f3d0;
            }

            .badge-expired {
              background-color: #fef2f2;
              color: #991b1b;
              border: 1px solid #fca5a5;
            }

            .badge-neutral {
              background-color: #fef3c7;
              color: #78350f;
              border: 1px solid #fde68a;
            }

            .passport-card {
              border: 3px double #d97706;
              border-radius: 20px;
              padding: 30px;
              max-width: 800px;
              margin: 0 auto;
              background-color: #ffffff;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
              position: relative;
            }

            /* Decorative top border strip */
            .passport-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 10px;
              background: linear-gradient(90deg, #f59e0b, #fbbf24, #d97706);
              border-top-left-radius: 17px;
              border-top-right-radius: 17px;
            }

            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
              border-bottom: 2px solid #f5f5f4;
              padding-bottom: 20px;
            }

            .logo-placeholder {
              width: 60px;
              height: 60px;
              background-color: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 50%;
              display: inline-block;
              text-align: center;
              line-height: 56px;
              font-size: 24px;
              color: #d97706;
              font-weight: 900;
              margin-right: 15px;
            }

            .header-text h1 {
              font-size: 16px;
              font-weight: 900;
              margin: 0;
              letter-spacing: 0.5px;
              color: #78350f;
            }

            .header-text h2 {
              font-size: 12px;
              font-weight: 700;
              margin: 3px 0 0 0;
              color: #1c1917;
            }

            .header-text p {
              font-size: 10px;
              color: #78716c;
              margin: 2px 0 0 0;
              font-weight: 500;
            }

            .passport-title {
              text-align: center;
              font-weight: 900;
              text-transform: uppercase;
              font-size: 18px;
              margin: 20px 0;
              color: #1c1917;
              letter-spacing: 1px;
              border-bottom: 2px dashed #f59e0b;
              padding-bottom: 10px;
            }

            .grid-container {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 25px;
              margin-bottom: 25px;
            }

            .info-section {
              border: 1px solid #e7e5e4;
              border-radius: 12px;
              padding: 20px;
              background-color: #fafaf9;
            }

            .qr-section {
              border: 1px solid #e7e5e4;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              background-color: #fafaf9;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }

            .qr-image {
              width: 130px;
              height: 130px;
              border: 1px solid #d6d3d1;
              border-radius: 8px;
              padding: 4px;
              background-color: white;
            }

            .qr-label {
              font-size: 10px;
              font-weight: 700;
              color: #78716c;
              margin-top: 8px;
              font-family: monospace;
            }

            .info-title {
              font-size: 11px;
              font-weight: 800;
              color: #78350f;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 15px;
              border-bottom: 1px solid #e7e5e4;
              padding-bottom: 4px;
            }

            .info-table {
              width: 100%;
              border-collapse: collapse;
            }

            .info-table td {
              padding: 6px 0;
              font-size: 12px;
            }

            .info-table td.label {
              color: #78716c;
              font-weight: 600;
              width: 40%;
            }

            .info-table td.value {
              color: #1c1917;
              font-weight: 700;
            }

            .medical-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 12px;
            }

            .medical-table th {
              background-color: #fef3c7;
              color: #78350f;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 10px;
              padding: 10px;
              border: 1px solid #fde68a;
              text-align: left;
            }

            .medical-table td {
              padding: 10px;
              border: 1px solid #e7e5e4;
            }

            .signatures {
              margin-top: 35px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              text-align: center;
            }

            .sig-line {
              border-top: 1.5px solid #d6d3d1;
              margin-top: 50px;
              padding-top: 8px;
              font-size: 11px;
              font-weight: 700;
              color: #44403c;
            }

            .sig-sub {
              font-size: 9px;
              color: #78716c;
              font-weight: 500;
              margin-top: 2px;
            }

            .footer-note {
              text-align: center;
              font-size: 9px;
              color: #a8a29e;
              margin-top: 30px;
              border-top: 1px solid #f5f5f4;
              padding-top: 15px;
              font-weight: 500;
            }

            @media print {
              body {
                padding: 0;
              }
              .passport-card {
                box-shadow: none;
                border: 2px solid #d97706;
              }
              button.print-trigger {
                display: none;
              }
            }

            .print-trigger-container {
              text-align: center;
              margin-bottom: 20px;
            }

            .print-trigger {
              background-color: #f59e0b;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 13px;
              font-weight: 700;
              border-radius: 8px;
              cursor: pointer;
              transition: all 0.2s;
              display: inline-flex;
              align-items: center;
              gap: 8px;
            }

            .print-trigger:hover {
              background-color: #d97706;
            }
          </style>
        </head>
        <body>
          <div class="print-trigger-container">
            <button class="print-trigger" onclick="window.print()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print / Save as PDF
            </button>
          </div>

          <div class="passport-card">
            <table class="header-table">
              <tr>
                <td style="width: 70px;">
                  <div class="logo-placeholder">🐾</div>
                </td>
                <td class="header-text">
                  <h1>PROVINCE OF SORSOGON</h1>
                  <h2>MUNICIPALITY OF IROSIN</h2>
                  <p>OFFICE OF THE MUNICIPAL AGRICULTURIST / VETERINARY MONITORING SECTION</p>
                </td>
              </tr>
            </table>

            <div class="passport-title">Official Veterinary Medical Passport</div>

            <div class="grid-container">
              <div class="info-section">
                <div class="info-title">Subject Profile</div>
                <table class="info-table">
                  <tr>
                    <td class="label">Animal Name:</td>
                    <td class="value" style="font-size: 14px; color: #78350f;">${pet.name}</td>
                  </tr>
                  <tr>
                    <td class="label">Classification:</td>
                    <td class="value">${pet.classification}</td>
                  </tr>
                  <tr>
                    <td class="label">Breed / Visual:</td>
                    <td class="value">${pet.breed} • ${pet.color}</td>
                  </tr>
                  <tr>
                    <td class="label">Gender:</td>
                    <td class="value">${pet.gender}</td>
                  </tr>
                  <tr>
                    <td class="label">Confinement Class:</td>
                    <td class="value">
                      <span class="badge ${pet.confinementSetup === 'Leashed' ? 'badge-neutral' : 'badge-expired'}">
                        ${pet.confinementSetup}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td class="label">Registered Barangay:</td>
                    <td class="value">Brgy. ${pet.barangay}</td>
                  </tr>
                </table>
              </div>

              <div class="qr-section">
                <div class="info-title" style="margin-bottom: 10px; border: none;">Collar Collar Tag ID</div>
                <img class="qr-image" src="${qrCodeUrl}" alt="Registry Collar QR" />
                <div class="qr-label">${pet.id}</div>
              </div>
            </div>

            <div class="info-section" style="margin-bottom: 25px;">
              <div class="info-title">Registered Owner Details</div>
              <table class="info-table">
                <tr>
                  <td class="label">Owner Name:</td>
                  <td class="value">${pet.ownerName}</td>
                </tr>
                <tr>
                  <td class="label">Primary Contact:</td>
                  <td class="value">${pet.ownerPhone}</td>
                </tr>
                <tr>
                  <td class="label">Irosin Address:</td>
                  <td class="value">Brgy. ${pet.barangay}, Irosin, Sorsogon</td>
                </tr>
              </table>
            </div>

            <div class="info-section">
              <div class="info-title">Immunization & Surgical Dossier</div>
              <table class="medical-table">
                <thead>
                  <tr>
                    <th>Procedure/Vaccine</th>
                    <th>Recorded Status</th>
                    <th>Log Date</th>
                    <th>Recommended Booster</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="font-weight: 700;">Anti-Rabies Shot</td>
                    <td>
                      <span class="badge ${pet.vaccinatedStatus === 'Active' ? 'badge-active' : 'badge-expired'}">
                        ${pet.vaccinatedStatus}
                      </span>
                    </td>
                    <td>${pet.lastVaccinatedDate || 'Unvaccinated'}</td>
                    <td style="color: #78350f; font-weight: 700;">${boosterDate}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 700;">Sterilization Surgery</td>
                    <td>
                      <span class="badge badge-neutral">
                        ${pet.spayNeuterStatus}
                      </span>
                    </td>
                    <td>${pet.lastSurgicalDate || 'Intact'}</td>
                    <td>N/A (Permanent)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="signatures">
              <div>
                <div class="sig-line">Dr. Maria Santos, DVM</div>
                <div class="sig-sub">Municipal Veterinarian</div>
                <div class="sig-sub">License No. 128475</div>
              </div>
              <div>
                <div class="sig-line">Authorized Veterinary Specialist</div>
                <div class="sig-sub">Private Clinic / Partner Operator</div>
                <div class="sig-sub">Irosin, Sorsogon Municipal Vet Section</div>
              </div>
            </div>

            <div class="footer-note">
              This veterinary passport is a legal identity certificate linked to the Irosin Municipal Animal Control and Monitoring System. Any changes must be officially registered at the Office of the Municipal Agriculturist.
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
        title="Generate Official Passport Printable Certificate"
      >
        <Printer className="h-3.5 w-3.5" />
        <span>Medical Passport</span>
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        onClick={handlePrint}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer select-none"
      >
        <FileText className="h-4 w-4 text-amber-500 animate-pulse-slow" />
        <span>Export Passport PDF</span>
      </button>
    );
  }

  return (
    <button
      onClick={handlePrint}
      className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer select-none"
    >
      <Printer className="h-4 w-4" />
      <span>Generate Printable Passport (PDF)</span>
    </button>
  );
}
