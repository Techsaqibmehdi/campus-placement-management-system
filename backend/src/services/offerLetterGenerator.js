const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

/**
 * Generates an official, branded Employment Offer Letter PDF
 * @param {Object} data
 * @param {Object} data.student - { name, rollNumber, course, branch, college, email }
 * @param {Object} data.company - { name, location, website }
 * @param {Object} data.drive - { jobTitle, package, baseSalary, variableSalary, location }
 * @param {Object} data.offer - { _id, joiningDate, offerDate, package, baseSalary, variableSalary }
 * @param {string} [outputPath] - Optional explicit output file path
 * @returns {Promise<{ filePath: string, relativeUrl: string, refNumber: string }>}
 */
function generateOfferLetterPDF(data, explicitOutputPath = null) {
  return new Promise((resolve, reject) => {
    try {
      const { student, company, drive, offer } = data;

      const outputDir = path.join(__dirname, "../../uploads/offer_letters");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const offerId = (offer?._id || Date.now()).toString();
      const shortId = offerId.slice(-6).toUpperCase();
      const refNumber = `CRPC/OFFER/${new Date().getFullYear()}/${shortId}`;
      const fileName = `offer_letter_${(student?.name || "candidate").replace(/[^a-zA-Z0-9]/g, "_")}_${shortId}.pdf`;
      const filePath = explicitOutputPath || path.join(outputDir, fileName);
      const relativeUrl = `/uploads/offer_letters/${fileName}`;

      // Create PDF Document with A4 margins
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, bottom: 36, left: 42, right: 42 },
        info: {
          Title: `Employment Offer Letter - ${student?.name || "Student"}`,
          Author: "XYZ Group of Institutions - CRPC",
          Subject: `Offer for ${drive?.jobTitle || "Role"} at ${company?.name || "Company"}`,
          Keywords: "Offer Letter, Campus Placement, XYZ, CRPC",
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - 84; // 42 left, 42 right

      // 1. Decorative Outer Border
      doc
        .rect(20, 20, pageWidth - 40, pageHeight - 40)
        .lineWidth(1.5)
        .strokeColor("#1e3a8a")
        .stroke();

      doc
        .rect(23, 23, pageWidth - 46, pageHeight - 46)
        .lineWidth(0.5)
        .strokeColor("#93c5fd")
        .stroke();

      // 2. Header Top Bar
      doc.rect(24, 24, pageWidth - 48, 8).fill("#1e3a8a");

      // 3. Institutional Letterhead Header
      doc.y = 42;
      doc
        .fillColor("#0f172a")
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("XYZ GROUP OF INSTITUTIONS", { align: "center", characterSpacing: 0.5 });

      doc
        .fillColor("#1e3a8a")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("CORPORATE RELATIONS & PLACEMENT CENTRE (CRPC)", { align: "center" });

      doc
        .fillColor("#64748b")
        .fontSize(8)
        .font("Helvetica")
        .text(
          "Delhi-NCR | www.xyz.edu | crpc@xyz.edu",
          { align: "center" }
        );

      doc
        .fillColor("#047857")
        .fontSize(7.5)
        .font("Helvetica-Bold")
        .text(
          "Accredited Grade 'A+' by NAAC | Approved by AICTE, New Delhi | NBA Accredited Programs",
          { align: "center" }
        );

      doc.moveDown(0.6);

      // Separator Line
      const sepY = doc.y;
      doc
        .moveTo(42, sepY)
        .lineTo(pageWidth - 42, sepY)
        .lineWidth(1)
        .strokeColor("#cbd5e1")
        .stroke();

      doc
        .moveTo(42, sepY + 2)
        .lineTo(pageWidth - 42, sepY + 2)
        .lineWidth(0.5)
        .strokeColor("#0284c7")
        .stroke();

      doc.moveDown(0.8);

      // 4. Corporate Partner Banner Ribbon
      const bannerY = doc.y;
      doc
        .roundedRect(42, bannerY, contentWidth, 24, 4)
        .fillColor("#eff6ff")
        .fill();

      doc
        .fillColor("#1e40af")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(
          `CAMPUS HIRING PARTNER: ${(company?.name || "Corporate Partner").toUpperCase()}  •  EMPLOYMENT OFFER LETTER`,
          48,
          bannerY + 7,
          { width: contentWidth - 12, align: "center" }
        );

      doc.moveDown(1.2);

      // 5. Ref No and Date Row
      const metaY = doc.y;
      doc
        .fillColor("#334155")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(`Ref. No: ${refNumber}`, 42, metaY);

      const formattedOfferDate = offer?.offerDate
        ? new Date(offer.offerDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });

      doc
        .fillColor("#334155")
        .fontSize(9)
        .font("Helvetica")
        .text(`Date of Issue: ${formattedOfferDate}`, 42, metaY, {
          align: "right",
          width: contentWidth,
        });

      doc.moveDown(1.2);

      // 6. Addressee / Candidate Information Box
      const candBoxY = doc.y;
      doc
        .roundedRect(42, candBoxY, contentWidth, 54, 4)
        .fillColor("#f8fafc")
        .strokeColor("#e2e8f0")
        .lineWidth(1)
        .fillAndStroke();

      doc
        .fillColor("#64748b")
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("ISSUED TO CANDIDATE:", 50, candBoxY + 6);

      doc
        .fillColor("#0f172a")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(student?.name || "Selected Candidate", 50, candBoxY + 18);

      const rollStr = student?.rollNumber ? `Roll No: ${student.rollNumber}` : "Roll No: Registered";
      const branchStr = `${student?.course || "B.Tech"} - ${student?.branch || "Computer Science and Engineering"}`;

      doc
        .fillColor("#475569")
        .fontSize(8.5)
        .font("Helvetica")
        .text(`${rollStr}  |  ${branchStr}`, 50, candBoxY + 31);

      doc
        .fillColor("#64748b")
        .fontSize(8)
        .font("Helvetica")
        .text(
          `${student?.college || "XYZ Group of Institutions"}  |  Email: ${student?.email || "student@xyz.edu"}`,
          50,
          candBoxY + 42
        );

      doc.y = candBoxY + 62;

      // 7. Subject Line
      const jobTitle = drive?.jobTitle || offer?.jobTitle || "Software Engineer";
      const companyName = company?.name || "Corporate Organization";

      doc
        .fillColor("#0f172a")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
          `Subject: Letter of Intent & Campus Placement Offer for the position of "${jobTitle}"`,
          42,
          doc.y,
          { underline: true }
        );

      doc.moveDown(0.7);

      // 8. Opening Body Text
      doc
        .fillColor("#334155")
        .fontSize(8.5)
        .font("Helvetica")
        .text(
          `Dear ${student?.name || "Candidate"},\n` +
            `On behalf of ${companyName} and in coordination with the Corporate Relations & Placement Centre (CRPC), ` +
            `XYZ Group of Institutions, we are delighted to extend to you this formal offer of employment. ` +
            `Your selection is the result of your exemplary performance, technical proficiency, and professional attributes ` +
            `demonstrated during the campus recruitment process.`,
          42,
          doc.y,
          { align: "justify", lineGap: 2.5 }
        );

      doc.moveDown(0.7);

      // 9. Compensation & Role Table
      const pkg = Number(offer?.package || drive?.package || 0);
      const isSuperDream = pkg >= 10;
      const isDream = pkg >= 6 && pkg < 10;
      const tierName = isSuperDream
        ? "Super Dream Tier (≥ 10 LPA)"
        : isDream
        ? "Dream Tier (6 - 10 LPA)"
        : "Regular Placement Tier";

      const baseSalary = offer?.baseSalary || drive?.baseSalary;
      const variableSalary = offer?.variableSalary || drive?.variableSalary;
      const location = drive?.location || company?.location || "Delhi-NCR / As Assigned";

      const formattedJoiningDate = offer?.joiningDate
        ? new Date(offer.joiningDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "To be communicated by HR / Post Graduation";

      const tableY = doc.y;
      const rowHeight = 17;
      const tableRows = [
        ["Designation / Job Role", jobTitle],
        ["Total Annual CTC Package", `₹ ${pkg.toFixed(2)} Lakhs Per Annum (LPA)`],
        [
          "Fixed Base Salary",
          baseSalary ? `₹ ${Number(baseSalary).toFixed(2)} LPA` : "As per company standard structure",
        ],
        [
          "Performance / Variable Component",
          variableSalary ? `₹ ${Number(variableSalary).toFixed(2)} LPA` : "Performance & incentive linked",
        ],
        ["Placement Category / Tier", tierName],
        ["Work Location / Headquarters", location],
        ["Anticipated Joining Date", formattedJoiningDate],
      ];

      const tableHeight = tableRows.length * rowHeight;

      // Table Header Background
      doc
        .rect(42, tableY, contentWidth, rowHeight)
        .fillColor("#1e3a8a")
        .fill();

      doc
        .fillColor("#ffffff")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("POSITION & COMPENSATION BREAKDOWN", 50, tableY + 4);

      doc
        .fillColor("#ffffff")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("DETAILS & SPECIFICATIONS", 220, tableY + 4);

      // Table Rows
      tableRows.forEach((row, idx) => {
        const rowY = tableY + (idx + 1) * rowHeight;
        const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";

        doc
          .rect(42, rowY, contentWidth, rowHeight)
          .fillColor(bg)
          .strokeColor("#e2e8f0")
          .lineWidth(0.5)
          .fillAndStroke();

        doc
          .fillColor("#475569")
          .fontSize(8)
          .font("Helvetica-Bold")
          .text(row[0], 50, rowY + 4, { width: 160 });

        doc
          .fillColor(idx === 1 ? "#047857" : "#0f172a")
          .fontSize(8)
          .font(idx === 1 ? "Helvetica-Bold" : "Helvetica")
          .text(row[1], 220, rowY + 4, { width: contentWidth - 185 });
      });

      doc.y = tableY + (tableRows.length + 1) * rowHeight + 8;

      // 10. Key Terms and Conditions
      doc
        .fillColor("#0f172a")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("TERMS & ACCEPTANCE PROTOCOL:");

      doc.moveDown(0.2);

      const terms = [
        "1. Acceptance: Candidate must review and confirm acceptance of this offer via the XYZ Placement Portal within seven (7) calendar days.",
        "2. Academic Standards: This offer is contingent upon passing all degree coursework without active backlogs and maintaining ethical conduct.",
        "3. Background Verification: Subject to satisfactory verification of original academic credentials, certificates, and background records.",
        "4. Institutional Policy: Governed by the One-Offer & Placement Policy of XYZ CRPC. Dream/Super Dream upgrade rules apply.",
      ];

      terms.forEach((t) => {
        doc
          .fillColor("#475569")
          .fontSize(7.5)
          .font("Helvetica")
          .text(t, { lineGap: 1 });
      });

      doc.moveDown(0.8);

      // 11. Signatures & Digital Verification Stamp Section
      const sigY = Math.max(doc.y, pageHeight - 145);

      // Left Signature: Head CRPC
      doc
        .moveTo(42, sigY + 30)
        .lineTo(190, sigY + 30)
        .lineWidth(1)
        .strokeColor("#0f172a")
        .stroke();

      doc
        .fillColor("#0f172a")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("Head - Placement & Relations", 42, sigY + 34);

      doc
        .fillColor("#64748b")
        .fontSize(7.5)
        .font("Helvetica")
        .text("Corporate Relations & Placement Centre\nXYZ Group of Institutions", 42, sigY + 44);

      // Center: Circular Digital Verification Seal
      const stampCenterX = pageWidth / 2;
      const stampCenterY = sigY + 28;

      doc
        .circle(stampCenterX, stampCenterY, 26)
        .lineWidth(1.5)
        .strokeColor("#047857")
        .stroke();

      doc
        .circle(stampCenterX, stampCenterY, 23)
        .lineWidth(0.5)
        .strokeColor("#047857")
        .stroke();

      doc
        .fillColor("#047857")
        .fontSize(6)
        .font("Helvetica-Bold")
        .text("XYZ CRPC", stampCenterX - 20, stampCenterY - 14, { width: 40, align: "center" })
        .text("VERIFIED", stampCenterX - 20, stampCenterY - 5, { width: 40, align: "center" })
        .text("OFFICIAL SEAL", stampCenterX - 20, stampCenterY + 4, { width: 40, align: "center" });

      // Right Signature: Corporate Partner
      doc
        .moveTo(pageWidth - 190, sigY + 30)
        .lineTo(pageWidth - 42, sigY + 30)
        .lineWidth(1)
        .strokeColor("#0f172a")
        .stroke();

      doc
        .fillColor("#0f172a")
        .fontSize(8.5)
        .font("Helvetica-Bold")
        .text("Authorized Talent Acquisition Head", pageWidth - 190, sigY + 34, {
          width: 148,
          align: "right",
        });

      doc
        .fillColor("#64748b")
        .fontSize(7.5)
        .font("Helvetica")
        .text(
          `Campus Recruitment & HR Operations\n${companyName}`,
          pageWidth - 190,
          sigY + 44,
          { width: 148, align: "right" }
        );

      // 12. Bottom System Authenticated Footer
      doc
        .rect(24, pageHeight - 32, pageWidth - 48, 8)
        .fillColor("#1e3a8a")
        .fill();

      doc
        .fillColor("#94a3b8")
        .fontSize(6.5)
        .font("Helvetica")
        .text(
          `Document Security Hash: ${offerId} | Generated via XYZ CRPC Placement Cockpit Automation System | Official Document`,
          24,
          pageHeight - 22,
          { align: "center", width: pageWidth - 48 }
        );

      doc.end();

      writeStream.on("finish", () => {
        resolve({
          filePath,
          relativeUrl,
          refNumber,
          fileName,
        });
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateOfferLetterPDF,
};

