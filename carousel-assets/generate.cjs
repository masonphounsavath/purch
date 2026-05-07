const pptxgen = require("pptxgenjs");
const path = require("path");

const ASSETS = path.join(__dirname);
const OUTPUT = path.join(__dirname, "../purch-linkedin-carousel.pptx");

// Colors
const NAVY = "1a1a2e";
const CREAM = "f5f0e8";
const WHITE = "ffffff";
const GRAY = "8a8fa8";
const LIGHT_GRAY = "c8cad6";

async function build() {
  const pres = new pptxgen();

  // Square 10x10 inches
  pres.defineLayout({ name: "SQUARE", width: 10, height: 10 });
  pres.layout = "SQUARE";
  pres.title = "Purch — LinkedIn Carousel";

  // ─── Slide 1: Hook ───────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };

    // Subtle dot grid texture via small circles
    for (let x = 0.5; x < 10; x += 0.8) {
      for (let y = 0.5; y < 10; y += 0.8) {
        s.addShape(pres.shapes.OVAL, {
          x, y, w: 0.04, h: 0.04,
          fill: { color: "ffffff", transparency: 88 },
          line: { color: NAVY }
        });
      }
    }

    // Purch wordmark
    s.addText("purch", {
      x: 0.6, y: 0.55, w: 2, h: 0.4,
      fontSize: 16, fontFace: "Georgia", color: GRAY,
      bold: false, italic: false, margin: 0
    });

    // Main headline
    s.addText([
      { text: "I built a\nsublease app\nfor UNC.", options: { breakLine: false } }
    ], {
      x: 0.6, y: 1.5, w: 8.8, h: 4.5,
      fontSize: 66, fontFace: "Georgia", color: WHITE,
      bold: true, lineSpacingMultiple: 1.1, margin: 0
    });

    // Subtext
    s.addText("No marketing. No ads.\nJust word of mouth.", {
      x: 0.6, y: 6.8, w: 8, h: 1.2,
      fontSize: 22, fontFace: "Calibri", color: GRAY,
      lineSpacingMultiple: 1.4, margin: 0
    });

    // Swipe hint
    s.addText("swipe to see what happened →", {
      x: 0.6, y: 9.1, w: 8, h: 0.5,
      fontSize: 13, fontFace: "Calibri", color: GRAY,
      italic: true, margin: 0
    });

    // Slide number
    s.addShape(pres.shapes.OVAL, {
      x: 9.0, y: 9.1, w: 0.5, h: 0.5,
      fill: { color: "ffffff", transparency: 80 },
      line: { color: NAVY }
    });
    s.addText("1", {
      x: 9.0, y: 9.1, w: 0.5, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: WHITE,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ─── Slide 2: The Problem ─────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };

    // Top accent bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.08,
      fill: { color: NAVY }, line: { color: NAVY }
    });

    s.addText("THE PROBLEM", {
      x: 0.7, y: 0.6, w: 6, h: 0.4,
      fontSize: 11, fontFace: "Calibri", color: NAVY,
      bold: true, charSpacing: 4, margin: 0
    });

    s.addText("Finding a sublease is broken.", {
      x: 0.7, y: 1.3, w: 8.6, h: 1.4,
      fontSize: 44, fontFace: "Georgia", color: NAVY,
      bold: true, lineSpacingMultiple: 1.1, margin: 0
    });

    // Problem items
    const problems = [
      { icon: "📱", label: "Snap story ads", sub: "Disappear in 24 hours. No structure." },
      { icon: "💬", label: "GroupMe chats", sub: "Buried in noise. Hard to search." },
      { icon: "📘", label: "Facebook groups", sub: "Outdated listings. No way to verify." },
    ];

    problems.forEach((p, i) => {
      const y = 3.2 + i * 1.65;
      // Background card
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.65, y, w: 8.7, h: 1.35,
        fill: { color: "ffffff", transparency: 30 },
        line: { color: "e0dbd1", width: 1 }
      });
      // Left accent
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.65, y, w: 0.06, h: 1.35,
        fill: { color: NAVY }, line: { color: NAVY }
      });
      s.addText(p.icon + "  " + p.label, {
        x: 0.9, y: y + 0.15, w: 7.5, h: 0.45,
        fontSize: 17, fontFace: "Calibri", color: NAVY,
        bold: true, margin: 0
      });
      s.addText(p.sub, {
        x: 0.9, y: y + 0.6, w: 7.5, h: 0.45,
        fontSize: 14, fontFace: "Calibri", color: "555555",
        margin: 0
      });
    });

    // Slide number
    s.addText("2 / 7", {
      x: 0.6, y: 9.35, w: 2, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: LIGHT_GRAY, margin: 0
    });
  }

  // ─── Slide 3: Introducing Purch (homepage screenshot) ────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.08,
      fill: { color: NAVY }, line: { color: NAVY }
    });

    s.addText("INTRODUCING", {
      x: 0.7, y: 0.45, w: 5, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: NAVY,
      bold: true, charSpacing: 4, margin: 0
    });

    s.addText("Purch", {
      x: 0.7, y: 0.9, w: 5, h: 1,
      fontSize: 52, fontFace: "Georgia", color: NAVY,
      bold: true, italic: true, margin: 0
    });

    // App screenshot
    s.addImage({
      path: path.join(ASSETS, "home_crop.jpg"),
      x: 0.4, y: 2.0, w: 9.2, h: 6.5,
      sizing: { type: "contain", w: 9.2, h: 6.5 }
    });

    s.addText("Sign in with your @unc.edu — no new password needed.", {
      x: 0.7, y: 8.65, w: 8.6, h: 0.6,
      fontSize: 13, fontFace: "Calibri", color: "555555",
      italic: true, margin: 0
    });

    s.addText("3 / 7", {
      x: 0.6, y: 9.35, w: 2, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: LIGHT_GRAY, margin: 0
    });
  }

  // ─── Slide 4: Browse listings ─────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.08,
      fill: { color: NAVY }, line: { color: NAVY }
    });

    s.addText("BROWSE & FILTER", {
      x: 0.7, y: 0.45, w: 8, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: NAVY,
      bold: true, charSpacing: 4, margin: 0
    });

    s.addText("22 listings.\nSearch by price,\nbeds & move-in date.", {
      x: 0.7, y: 0.9, w: 8.6, h: 2,
      fontSize: 34, fontFace: "Georgia", color: NAVY,
      bold: true, lineSpacingMultiple: 1.15, margin: 0
    });

    // Browse screenshot
    s.addImage({
      path: path.join(ASSETS, "browse_crop.jpg"),
      x: 0.4, y: 3.1, w: 9.2, h: 5.6,
      sizing: { type: "contain", w: 9.2, h: 5.6 }
    });

    s.addText("Map view + filters. See every listing at a glance.", {
      x: 0.7, y: 8.8, w: 8.6, h: 0.5,
      fontSize: 13, fontFace: "Calibri", color: "555555",
      italic: true, margin: 0
    });

    s.addText("4 / 7", {
      x: 0.6, y: 9.35, w: 2, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: LIGHT_GRAY, margin: 0
    });
  }

  // ─── Slide 5: Listing detail ──────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.08,
      fill: { color: NAVY }, line: { color: NAVY }
    });

    s.addText("REAL LISTINGS", {
      x: 0.7, y: 0.45, w: 8, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: NAVY,
      bold: true, charSpacing: 4, margin: 0
    });

    s.addText("Photos. Pricing.\nDirect message.\nNo middleman.", {
      x: 0.7, y: 0.9, w: 8.6, h: 2.1,
      fontSize: 34, fontFace: "Georgia", color: NAVY,
      bold: true, lineSpacingMultiple: 1.15, margin: 0
    });

    s.addImage({
      path: path.join(ASSETS, "listing_crop.jpg"),
      x: 0.4, y: 3.1, w: 9.2, h: 5.6,
      sizing: { type: "contain", w: 9.2, h: 5.6 }
    });

    s.addText("From real UNC students. Verified with .edu email.", {
      x: 0.7, y: 8.8, w: 8.6, h: 0.5,
      fontSize: 13, fontFace: "Calibri", color: "555555",
      italic: true, margin: 0
    });

    s.addText("5 / 7", {
      x: 0.6, y: 9.35, w: 2, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: LIGHT_GRAY, margin: 0
    });
  }

  // ─── Slide 6: Traction ────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: NAVY };

    for (let x = 0.5; x < 10; x += 0.8) {
      for (let y = 0.5; y < 10; y += 0.8) {
        s.addShape(pres.shapes.OVAL, {
          x, y, w: 0.04, h: 0.04,
          fill: { color: "ffffff", transparency: 88 },
          line: { color: NAVY }
        });
      }
    }

    s.addText("purch", {
      x: 0.6, y: 0.55, w: 2, h: 0.4,
      fontSize: 16, fontFace: "Georgia", color: GRAY,
      margin: 0
    });

    s.addText("Week one.\nWord of mouth only.", {
      x: 0.6, y: 1.4, w: 8.8, h: 1.4,
      fontSize: 22, fontFace: "Calibri", color: GRAY,
      lineSpacingMultiple: 1.4, margin: 0
    });

    // Big stat 1
    s.addText("40", {
      x: 0.5, y: 3.0, w: 9, h: 2.2,
      fontSize: 130, fontFace: "Georgia", color: WHITE,
      bold: true, margin: 0
    });
    s.addText("users", {
      x: 0.6, y: 5.1, w: 4, h: 0.6,
      fontSize: 22, fontFace: "Calibri", color: GRAY,
      margin: 0
    });

    // Divider
    s.addShape(pres.shapes.LINE, {
      x: 0.6, y: 5.9, w: 8.8, h: 0,
      line: { color: "ffffff", transparency: 75, width: 1 }
    });

    // Big stat 2
    s.addText("22", {
      x: 0.5, y: 5.9, w: 9, h: 2.2,
      fontSize: 130, fontFace: "Georgia", color: WHITE,
      bold: true, margin: 0
    });
    s.addText("listings", {
      x: 0.6, y: 8.0, w: 4, h: 0.6,
      fontSize: 22, fontFace: "Calibri", color: GRAY,
      margin: 0
    });

    s.addText("Students are already closing deals.", {
      x: 0.6, y: 8.85, w: 8, h: 0.5,
      fontSize: 13, fontFace: "Calibri", color: GRAY,
      italic: true, margin: 0
    });

    s.addShape(pres.shapes.OVAL, {
      x: 9.0, y: 9.1, w: 0.5, h: 0.5,
      fill: { color: "ffffff", transparency: 80 },
      line: { color: NAVY }
    });
    s.addText("6", {
      x: 9.0, y: 9.1, w: 0.5, h: 0.5,
      fontSize: 11, fontFace: "Calibri", color: WHITE,
      align: "center", valign: "middle", margin: 0
    });
  }

  // ─── Slide 7: CTA ─────────────────────────────────────────────────────────
  {
    const s = pres.addSlide();
    s.background = { color: CREAM };

    s.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.08,
      fill: { color: NAVY }, line: { color: NAVY }
    });

    s.addText("UNC CHAPEL HILL  ·  FREE TO USE", {
      x: 0.7, y: 0.45, w: 8.6, h: 0.35,
      fontSize: 10, fontFace: "Calibri", color: NAVY,
      bold: true, charSpacing: 3, margin: 0
    });

    s.addText("Looking for a\nsublease this\nsummer or fall?", {
      x: 0.7, y: 1.2, w: 8.6, h: 3.4,
      fontSize: 46, fontFace: "Georgia", color: NAVY,
      bold: true, lineSpacingMultiple: 1.1, margin: 0
    });

    s.addText("Or have a place to list?", {
      x: 0.7, y: 4.75, w: 8.6, h: 0.65,
      fontSize: 20, fontFace: "Calibri", color: "555555",
      margin: 0
    });

    // CTA button shape
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.65, y: 5.8, w: 8.7, h: 1.5,
      fill: { color: NAVY }, line: { color: NAVY }
    });
    s.addText("purchit.org →", {
      x: 0.65, y: 5.8, w: 8.7, h: 1.5,
      fontSize: 38, fontFace: "Georgia", color: WHITE,
      bold: true, align: "center", valign: "middle", margin: 0
    });

    // Feature pills
    const features = ["Search listings", "Message directly", "Sign in with .edu"];
    features.forEach((f, i) => {
      const x = 0.65 + i * 3.05;
      s.addShape(pres.shapes.RECTANGLE, {
        x, y: 7.7, w: 2.8, h: 0.55,
        fill: { color: "e8e3da" }, line: { color: "d0cbc1", width: 1 }
      });
      s.addText(f, {
        x, y: 7.7, w: 2.8, h: 0.55,
        fontSize: 12, fontFace: "Calibri", color: NAVY,
        align: "center", valign: "middle", margin: 0
      });
    });

    s.addText("Built by a Tar Heel, for Tar Heels.", {
      x: 0.7, y: 8.65, w: 8.6, h: 0.5,
      fontSize: 13, fontFace: "Calibri", color: GRAY,
      italic: true, margin: 0
    });

    s.addText("7 / 7", {
      x: 0.6, y: 9.35, w: 2, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: LIGHT_GRAY, margin: 0
    });
  }

  await pres.writeFile({ fileName: OUTPUT });
  console.log("✓ Saved:", OUTPUT);
}

build().catch(console.error);
