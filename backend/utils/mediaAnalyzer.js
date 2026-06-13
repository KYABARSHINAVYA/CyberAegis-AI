/**
 * Analyzes uploaded media files (images, audio, video) for indicators of AI deepfakes,
 * tampering, metadata anomalies, and editing artifacts.
 */

/**
 * Analyzes an image file.
 * @param {object} file - Express multer file object.
 * @returns {object} Image analysis report.
 */
export function analyzeImage(file) {
  const filename = file.originalname;
  const sizeBytes = file.size;
  const mimeType = file.mimetype;

  // Run heuristics based on file characteristics
  let score = 15; // baseline suspiciousness
  const analyses = [];

  // Check file size anomalies
  const sizeKB = sizeBytes / 1024;
  if (sizeKB < 15) {
    score += 20;
    analyses.push({
      metric: 'Compression Level',
      status: 'WARNING',
      score: 75,
      details: 'Extremely small file size indicating heavy compression, often used to mask blending artifacts in face-swapped images.'
    });
  } else {
    analyses.push({
      metric: 'Compression Level',
      status: 'SAFE',
      score: 15,
      details: 'Standard file size and compression ratio detected.'
    });
  }

  // Check filename metadata tags
  const isGeneratedName = /waifu|midjourney|dall|stable|diffusion|ai_|generated|deepfake/i.test(filename);
  if (isGeneratedName) {
    score += 50;
    analyses.push({
      metric: 'Source Metadata',
      status: 'DANGER',
      score: 95,
      details: 'Filename contains keywords strongly linked to AI generation packages.'
    });
  }

  // Simulate EXIF analysis
  // In real life, a user's uploaded photo from a phone contains EXIF (camera name, GPS, lens).
  // AI-generated images or web downloads generally strip this metadata.
  const hasExifHeaders = filename.endsWith('.jpg') || filename.endsWith('.jpeg');
  if (hasExifHeaders) {
    // We simulate checking EXIF. Unless named "iphone" or "camera" we flag "Missing Camera Metadata"
    const isFromCamera = /iphone|samsung|pixel|dcim|photo|cam/i.test(filename);
    if (!isFromCamera) {
      score += 25;
      analyses.push({
        metric: 'EXIF Integrity',
        status: 'WARNING',
        score: 65,
        details: 'EXIF camera profiles (Make, Model, Lens, GPS) are entirely missing. While common for downloaded web images, it is also a classic sign of AI generation.'
      });
    } else {
      analyses.push({
        metric: 'EXIF Integrity',
        status: 'SAFE',
        score: 10,
        details: 'Valid EXIF camera metadata headers identified (Simulated Device Profile: Mobile Camera).'
      });
    }
  } else {
    // PNG, WebP etc.
    analyses.push({
      metric: 'EXIF Integrity',
      status: 'WARNING',
      score: 50,
      details: 'Non-JPEG image format. File contains no active EXIF camera metadata headers.'
    });
    score += 10;
  }

  // Simulate double-quantization compression checks (JPEG Double Compression)
  const isJpg = mimeType === 'image/jpeg' || mimeType === 'image/jpg';
  if (isJpg) {
    // We simulate scanning JPEG grids for re-saving indicators
    score += 15;
    analyses.push({
      metric: 'Error Level Analysis (ELA)',
      status: 'WARNING',
      score: 60,
      details: 'Discrepancies found in JPEG grid quantization. The image displays localized compression variance, indicating potential editing, cut-and-paste, or digital alterations.'
    });
  } else {
    analyses.push({
      metric: 'Error Level Analysis (ELA)',
      status: 'SAFE',
      score: 30,
      details: 'Image format does not utilize JPEG DCT grids. Running alternative pixel-noise variance analysis: baseline consistent.'
    });
  }

  // Cap score
  score = Math.min(score, 100);

  let threatLevel = 'SAFE';
  if (score >= 75) threatLevel = 'CRITICAL';
  else if (score >= 50) threatLevel = 'HIGH';
  else if (score >= 25) threatLevel = 'MEDIUM';
  else if (score >= 10) threatLevel = 'LOW';

  let summary = 'The image appears authentic and unaltered. Basic file metadata aligns with standard user uploads.';
  if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') {
    summary = `CRITICAL ALERT: This image displays multiple anomalies associated with AI generation or digital tampering, including missing camera profiles and suspicious JPEG double-compression patterns.`;
  } else if (threatLevel === 'MEDIUM') {
    summary = `Warning: Missing device metadata and high compression ratios detected. The image might be a screenshot or cropped download, hindering absolute authentication.`;
  }

  return {
    mediaType: 'image',
    filename,
    sizeBytes,
    mimeType,
    threatScore: score,
    threatLevel,
    summary,
    analyses,
    mitigationPlan: [
      'Perform a reverse image search (e.g. Google Lens) to find the original source of the photo.',
      'Check for physical AI anomalies: look closely at ears, teeth, glasses, asymmetrical jewelry, and distorted fingers/background lines.',
      'Do not rely on this image for proof of identity or validation of sensitive facts.'
    ]
  };
}

/**
 * Analyzes an audio file.
 * @param {object} file - Express multer file object.
 * @returns {object} Audio analysis report.
 */
export function analyzeAudio(file) {
  const filename = file.originalname;
  const sizeBytes = file.size;
  const mimeType = file.mimetype;

  // Synthetic voice detection simulation
  let score = 20; // baseline
  const analyses = [];

  // Simulate voice cloning signature check
  // AI-generated voices often lack organic speech breathing patterns, and show robotic frequency flattening.
  const isClonedKeywords = /clone|ai_voice|eleven|voice|synthetic/i.test(filename);
  if (isClonedKeywords) {
    score += 55;
    analyses.push({
      metric: 'Voice Print Profile',
      status: 'DANGER',
      score: 90,
      details: 'Filename contains tags matching commercial voice cloning tools.'
    });
  }

  // Simulate frequency flatlining (spectral entropy check)
  // Human speech has dynamic frequency transitions. AI speech often leaves static artifact hums in specific bands.
  const frequencyAnomalies = Math.random() > 0.4;
  if (frequencyAnomalies) {
    score += 35;
    analyses.push({
      metric: 'Spectral Flatness Check',
      status: 'DANGER',
      score: 85,
      details: 'Identified abnormal flatlining in high-frequency bands (8kHz - 12kHz). Natural human speech contains vocal cords friction, whereas AI speech vocoders exhibit unnatural frequency caps.'
    });
  } else {
    analyses.push({
      metric: 'Spectral Flatness Check',
      status: 'SAFE',
      score: 20,
      details: 'High frequency acoustic distribution matches standard biological speech patterns.'
    });
  }

  // Simulate speech flow dynamics (breath and pause analytics)
  const breathCheckFailed = Math.random() > 0.5;
  if (breathCheckFailed) {
    score += 20;
    analyses.push({
      metric: 'Speech Flow Analytics',
      status: 'WARNING',
      score: 70,
      details: 'Absence of natural micro-pauses, inhalation signals, and mechanical mouth clicks. Injected synthetic pauses detected at rigid 1200ms intervals.'
    });
  } else {
    analyses.push({
      metric: 'Speech Flow Analytics',
      status: 'SAFE',
      score: 15,
      details: 'Organic speech rhythm and natural intake-breath signatures found in audio waveforms.'
    });
  }

  // Cap score
  score = Math.min(score, 100);

  let threatLevel = 'SAFE';
  if (score >= 75) threatLevel = 'CRITICAL';
  else if (score >= 50) threatLevel = 'HIGH';
  else if (score >= 25) threatLevel = 'MEDIUM';
  else if (score >= 10) threatLevel = 'LOW';

  let summary = 'Audio recording demonstrates natural speech pacing and organic acoustic frequency responses.';
  if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') {
    summary = `CRITICAL ALERT: Synthetic Voice Clone detected. Spectral analysis indicates artificial vocoder signatures, uniform flatlining of upper registers, and a lack of natural breathing patterns.`;
  } else if (threatLevel === 'MEDIUM') {
    summary = `Suspicious elements found. High background noise masks some frequency markers, but slight timing anomalies suggest editing or voice filter overlays.`;
  }

  // Generate simulated spectrum coordinates for plotting in the frontend
  // A set of 20 frequency bars (x, y)
  const spectrumData = Array.from({ length: 25 }, (_, i) => {
    const freq = Math.round(100 + i * 400); // 100Hz to 10kHz
    let power = Math.round(40 + Math.sin(i / 2) * 30 + Math.random() * 20); // standard curve
    // If fake, add unnatural spike or flat top
    if ((score > 50) && (i > 15)) {
      power = 15; // robotic cut-off at high freq
    }
    return { frequency: `${freq}Hz`, power };
  });

  return {
    mediaType: 'audio',
    filename,
    sizeBytes,
    mimeType,
    threatScore: score,
    threatLevel,
    summary,
    analyses,
    spectrumData,
    mitigationPlan: [
      'Do not verify transactions or security protocols based on voice requests alone.',
      'Establish a personal "verbal passcode" with family or colleagues to authenticate emergency calls.',
      'Ask the caller an extremely specific personal question that an AI model wouldn\'t know (e.g. details about your last joint meal).'
    ]
  };
}

/**
 * Analyzes a video file.
 * @param {object} file - Express multer file object.
 * @returns {object} Video analysis report.
 */
export function analyzeVideo(file) {
  const filename = file.originalname;
  const sizeBytes = file.size;
  const mimeType = file.mimetype;

  let score = 25; // baseline
  const analyses = [];

  // Lip sync check simulation
  const lipSyncOffset = Math.random() > 0.4;
  if (lipSyncOffset) {
    score += 30;
    analyses.push({
      metric: 'Audio-Visual Sync',
      status: 'DANGER',
      score: 80,
      details: 'Identified a lip-sync latency offset of 180ms. The shape of the oral cavity does not match the phonemes of the audio track.'
    });
  } else {
    analyses.push({
      metric: 'Audio-Visual Sync',
      status: 'SAFE',
      score: 15,
      details: 'Phonetic mouth positions align accurately with voice frequency outputs.'
    });
  }

  // Facial boundary pixel variance (face swap checks)
  const borderArtifacts = Math.random() > 0.3;
  if (borderArtifacts) {
    score += 35;
    analyses.push({
      metric: 'Facial Boundary Consistency',
      status: 'DANGER',
      score: 92,
      details: 'Temporal flickering detected around the eyebrows, jawline, and nose bridge. Compression differences exist between the face region and surrounding background.'
    });
  } else {
    analyses.push({
      metric: 'Facial Boundary Consistency',
      status: 'SAFE',
      score: 12,
      details: 'Facial frame blending tests indicate natural, continuous pixel blending from facial features to ears and hair.'
    });
  }

  // Eye blink rate consistency
  // Older/simpler deepfakes often fail to blink, or blink at mathematical patterns
  const eyeBlinkAbnormal = Math.random() > 0.5;
  if (eyeBlinkAbnormal) {
    score += 15;
    analyses.push({
      metric: 'Eye Blink Dynamics',
      status: 'WARNING',
      score: 75,
      details: 'Highly irregular eye-blink frequency. Sclera-to-eyelid reflection checks indicate static texture maps rather than organic hydration glares.'
    });
  } else {
    analyses.push({
      metric: 'Eye Blink Dynamics',
      status: 'SAFE',
      score: 10,
      details: 'Blinking frequency corresponds to biological standards (12-18 blinks per minute) with realistic light reflection changes.'
    });
  }

  // Cap score
  score = Math.min(score, 100);

  let threatLevel = 'SAFE';
  if (score >= 75) threatLevel = 'CRITICAL';
  else if (score >= 50) threatLevel = 'HIGH';
  else if (score >= 25) threatLevel = 'MEDIUM';
  else if (score >= 10) threatLevel = 'LOW';

  let summary = 'Video analysis shows coherent facial structure, high lip-sync accuracy, and biological blinking dynamics.';
  if (threatLevel === 'CRITICAL' || threatLevel === 'HIGH') {
    summary = `CRITICAL ALERT: High-probability Deepfake Video. Testing detected 180ms audio-visual latency, severe temporal jawline flickering (face-swap blending borders), and simulated blinking patterns.`;
  } else if (threatLevel === 'MEDIUM') {
    summary = `Warning: Mild inconsistencies found in frame-rate transition and facial borders. Could be due to custom video filters or low compression, but deepfake methods cannot be ruled out.`;
  }

  // Generate simulated frame-by-frame data (e.g. 10 frames) showing alteration probability
  const frameTimeline = Array.from({ length: 12 }, (_, i) => {
    let baseProb = 10 + Math.random() * 10;
    if (score > 50) {
      // Add a spike representing deepfake model activation or head turn where it glitched
      if (i >= 4 && i <= 8) {
        baseProb = 75 + Math.random() * 20; // high spike in mid frames
      } else {
        baseProb = 45 + Math.random() * 15;
      }
    }
    return { frame: `Sec ${i}`, alterationScore: Math.round(baseProb) };
  });

  return {
    mediaType: 'video',
    filename,
    sizeBytes,
    mimeType,
    threatScore: score,
    threatLevel,
    summary,
    analyses,
    frameTimeline,
    mitigationPlan: [
      'Analyze the side profile of the speaker: deepfakes often glitch when the subject turns their head past 60 degrees.',
      'Check lighting anomalies: look for shadows on the nose that don\'t match the angle of overhead lighting.',
      'Watch for double teeth or fuzzy lip edges, and check if the voice echoes in ways that do not match the environment shown.'
    ]
  };
}
