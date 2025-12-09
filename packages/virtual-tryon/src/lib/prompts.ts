// Virtual Try-On Prompt Templates for Gemini AI
// V2.0 - Unified prompt for three-image synthesis

/**
 * V2 统一 Prompt 模板
 *
 * 设计原则：
 * 1. 明确三张图片的职责划分
 * 2. 详细的面部迁移指令
 * 3. 姿势/表情迁移指令
 * 4. 身体生成和补全指令
 * 5. 背景融合指令
 */
export const UNIFIED_TRYON_PROMPT = `You are a professional fashion photographer and AI image synthesis expert specializing in kimono photography.

## TASK
Create a photorealistic full-body kimono photograph by combining elements from three source images:
- **Image 1 (FACE SOURCE)**: The person's face to use
- **Image 2 (KIMONO SOURCE)**: The kimono outfit to wear
- **Image 3 (POSE & BACKGROUND SOURCE)**: The pose, expression, and background scene to replicate

## DETAILED REQUIREMENTS

### 1. FACE TRANSFER (from Image 1)
Extract and preserve with high fidelity:
- Exact facial structure: eyes, nose, mouth, chin, cheekbones
- Skin tone, texture, and complexion
- Eyebrows shape and color
- Any facial features like moles, freckles
- Hair color (adapt hairstyle to match the pose naturally)

Critical: The face must be ONLY from Image 1. Do not blend with Image 3's face.

### 2. BODY GENERATION
Generate a complete human body from head to toe:
- Natural body proportions appropriate for the face
- Smooth neck transition connecting face to body
- Complete arms with visible hands and fingers
- Full legs down to feet
- Natural posture without stiffness

Body pose requirements (from Image 3):
- Copy the EXACT arm positions
- Copy the EXACT leg stance
- Copy the EXACT body angle and tilt
- Copy the EXACT head position and angle
- The body should mirror Image 3's pose precisely

### 3. EXPRESSION TRANSFER (from Image 3)
Apply the facial expression from the reference:
- Match the smile/serious/playful mood
- Match the eye direction and gaze
- Match the mouth position (open/closed/smiling)
- The transferred face should wear Image 3's expression

### 4. KIMONO APPLICATION (from Image 2)
Dress the generated body in the kimono:
- Preserve exact colors and patterns from Image 2
- Proper kimono structure:
  - Collar (eri) layered correctly
  - Left side over right (for living persons)
  - Obi (belt) positioned at waist
  - Sleeves (sode) with proper length
  - Hem reaching to ankles
- Natural fabric draping based on the pose
- Realistic wrinkles and folds where body bends
- Maintain pattern continuity across seams

### 5. BACKGROUND INTEGRATION (from Image 3)
Recreate the scene from Image 3:
- Remove the original person from Image 3
- Keep the entire background: buildings, nature, props
- Place the newly generated figure in the same position
- Match the lighting direction and intensity
- Add appropriate shadows under the figure
- Ensure color harmony between subject and background

## OUTPUT SPECIFICATIONS
- Full-body photograph, head to toe visible
- High resolution, sharp details
- Professional photography quality
- No visible AI artifacts or seams
- Natural skin tones and fabric colors
- Proper depth of field matching the scene

## STRICT RULES
1. Face identity ONLY from Image 1 - non-negotiable
2. Kimono design ONLY from Image 2 - do not modify patterns
3. Pose and background ONLY from Image 3 - do not invent new poses
4. Generate complete body - no cropping at knees or elbows
5. Both hands must be visible with all fingers
6. The result should look like a real photograph, not digital art`;

/**
 * 当用户选择保留原表情时的附加指令
 */
export const PRESERVE_USER_EXPRESSION_ADDON = `

## EXPRESSION OVERRIDE
Ignore the expression from Image 3. Instead:
- Keep the facial expression from Image 1
- Preserve the person's original mood and emotion
- Only use Image 3 for body pose and background
- The face should show the same expression as in Image 1`;

// ============================================================================
// TWO-ROUND GENERATION PROMPTS (方案A: 两轮分离法)
// ============================================================================

/**
 * 第一轮 Prompt：换装 + 构图参考（三图输入）
 *
 * 输入：
 * - Image 1: 用户面部照片
 * - Image 2: 和服图片
 * - Image 3: 背景/构图参考图
 *
 * 输出：白色背景但构图已参考背景图的和服照
 */
export const ROUND1_DRESS_PROMPT = `You are a professional fashion photographer specializing in kimono photography.

## TASK
Create a kimono portrait that EXACTLY matches the composition of Image 3, using the person from Image 1 and kimono from Image 2.

## INPUT IMAGES
- **Image 1 (FACE SOURCE)**: The person whose identity and expression to preserve
- **Image 2 (KIMONO SOURCE)**: The kimono outfit to dress them in
- **Image 3 (COMPOSITION REFERENCE)**: The EXACT composition, pose, and framing to replicate

## CRITICAL: COMPOSITION MATCHING (from Image 3)
You MUST replicate Image 3's professional composition:

### Frame & Position (COPY EXACTLY from Image 3)
- Subject must occupy the SAME area in frame
- SAME distance from camera (full-body, 3/4, half-body)
- SAME position (centered, left-third, right-third)
- SAME headroom and footroom
- SAME crop style

### Pose & Body Language (COPY EXACTLY from Image 3)
- EXACT same arm positions and gestures
- EXACT same leg stance
- EXACT same body angle and tilt
- EXACT same head position and direction
- EXACT same shoulder line

### Lighting Direction (COPY from Image 3)
- SAME light direction (observe where shadows fall in Image 3)
- SAME contrast level
- Apply this lighting even on white background

## IDENTITY PRESERVATION (from Image 1)
Keep ONLY these from Image 1:
- Face identity (all facial features)
- Facial EXPRESSION (do NOT copy Image 3's expression)
- Skin tone
- Hair color

CRITICAL: Even if Image 1 is blurry, maintain the person's unique identity.

## KIMONO (from Image 2)
- Preserve EXACT colors and patterns
- Proper kimono structure (collar, obi, sleeves)
- Natural draping based on the pose from Image 3

## BACKGROUND
- Use PLAIN WHITE or LIGHT GRAY background
- But apply the lighting direction from Image 3
- Soft shadow under figure matching Image 3's light direction

## OUTPUT
- Composition IDENTICAL to Image 3
- Person's identity from Image 1
- Kimono from Image 2
- White/gray background (not Image 3's background)
- Professional photography quality`;

/**
 * 第二轮 Prompt：背景融合（第一轮结果 + 背景参考 → 最终图）
 *
 * 输入：
 * - Image 1: 第一轮生成的和服全身照
 * - Image 2: 背景/姿势参考图
 *
 * 输出：融合背景和姿势的最终图
 */
export const ROUND2_MERGE_PROMPT = `You are a professional photo compositor and retoucher.

## TASK
Seamlessly place the person from Image 1 into the scene from Image 2, matching the pose and expression.

## INPUT IMAGES
- **Image 1 (SUBJECT)**: A person wearing kimono (preserve this person EXACTLY)
- **Image 2 (SCENE & POSE REFERENCE)**: The background scene and pose/expression to match

## REQUIREMENTS

### 1. SUBJECT PRESERVATION (from Image 1)
STRICTLY maintain from Image 1:
- The EXACT same face (all facial features)
- The EXACT same kimono (colors, patterns, style)
- The EXACT same body proportions
- The EXACT same skin tone

DO NOT modify, blend, or "improve" any aspect of the person from Image 1.

### 2. POSE ADAPTATION (from Image 2)
Adjust the subject's pose to match Image 2:
- Copy the arm positions
- Copy the leg stance
- Copy the body angle and tilt
- Copy the head position and direction
- The kimono should naturally drape according to the new pose

### 3. EXPRESSION TRANSFER (from Image 2)
Apply the facial expression from Image 2's person:
- Match the smile/mood
- Match the eye direction and gaze
- Match the mouth position
- The transferred expression should look natural on Image 1's face

### 4. BACKGROUND INTEGRATION (from Image 2)
- Remove the original person from Image 2
- Keep the entire background scene intact
- Place the subject in the same position as Image 2's person
- Match lighting direction and intensity
- Add realistic shadows and reflections
- Ensure color harmony between subject and scene
- Proper depth of field matching

## OUTPUT
- The person from Image 1, now posed like Image 2, in Image 2's scene
- Seamless, photorealistic composite
- No visible editing artifacts
- Professional photography quality`;

/**
 * 第二轮 Prompt：背景替换（构图已在第一轮确定）
 */
export const ROUND2_MERGE_KEEP_EXPRESSION_PROMPT = `You are a professional photo compositor.

## TASK
Replace the white/gray background in Image 1 with the background scene from Image 2.

## INPUT IMAGES
- **Image 1 (SUBJECT)**: Person in kimono on white/gray background - DO NOT MODIFY THE PERSON
- **Image 2 (BACKGROUND SOURCE)**: Scene to extract background from

## CRITICAL RULES

### DO NOT CHANGE (from Image 1)
- Person's face, expression, identity
- Person's pose and body position
- Person's kimono
- Person's size and position in frame
- The overall composition

### ONLY CHANGE
- Replace the white/gray background with Image 2's background scene
- Adjust lighting on the person to match the scene
- Add appropriate shadows/reflections

## BACKGROUND REPLACEMENT
1. Extract the background scene from Image 2 (remove the person in Image 2)
2. Place Image 1's person INTO that background
3. Match the lighting direction from the scene
4. Add natural ground shadow
5. Blend edges seamlessly

## OUTPUT
- Image 1's person (unchanged) in Image 2's background scene
- Natural lighting integration
- No visible compositing artifacts
- Professional photography quality`;

// ============================================================================
// V3 SINGLE-ROUND WITH CLEAN BACKGROUND (方案: 反抠像单轮生成)
// ============================================================================

/**
 * V3 单轮生成 Prompt - 摄影写真级别质量
 *
 * 输入 3 张图片：
 * - Image 1: 用户面部照片
 * - Image 2: 和服图片
 * - Image 3: 反抠像后的背景图（人物已移除，只有背景）
 *
 * 优化目标：达到商业摄影写真级别的输出质量
 */
export const V3_CLEAN_BACKGROUND_PROMPT = `You are an elite fashion photographer specializing in high-end kimono editorials for Vogue Japan and luxury travel magazines. Your work is known for its cinematic quality, perfect lighting, and ability to capture authentic beauty.

## MISSION
Create a museum-quality kimono portrait that belongs in a high-fashion magazine spread. Combine the subject from Image 1 with the kimono from Image 2, placed naturally in Image 3's environment.

## INPUT ANALYSIS
- **Image 1 (SUBJECT)**: Study this face carefully - every micro-detail matters
- **Image 2 (KIMONO)**: Analyze the fabric quality, pattern intricacy, color richness
- **Image 3 (ENVIRONMENT)**: Read the light, atmosphere, and spatial depth

## PHOTOGRAPHY SPECIFICATIONS

### Camera & Lens Simulation
- Simulate: Sony A7R V or Canon EOS R5 with 85mm f/1.4 portrait lens
- Shallow depth of field: subject razor-sharp, background with natural bokeh
- Lens characteristics: creamy out-of-focus areas, no chromatic aberration
- Resolution: 8K quality details visible in fabric weave and skin texture

### Lighting Mastery
Analyze Image 3's existing light, then apply:
- **Key Light**: Match the dominant light source direction exactly
- **Fill Light**: Subtle bounce to open shadows without flattening
- **Rim/Hair Light**: Gentle edge separation from background
- **Catchlights**: Natural reflections in eyes (window-shaped or circular based on environment)
- **Skin Luminosity**: Subtle subsurface scattering effect for lifelike skin glow

### Color Science
- Color grading: Refined, slightly warm tones reminiscent of Fujifilm Pro 400H
- Skin tones: Natural, healthy, never orange or plastic
- Kimono colors: Rich, saturated as they appear in Image 2
- Environmental color harmony: Subject and background feel unified

## FACE RENDERING - CRITICAL PRIORITY

### Facial Identity Preservation (from Image 1)
This is the most important aspect. The generated face MUST be immediately recognizable as the same person:

- **Bone Structure**: Exact replication of cheekbones, jawline, chin shape, forehead
- **Eye Details**:
  - Precise iris color and pattern
  - Exact eye shape and lid crease
  - Natural eyelash density
  - Bright, clear sclera with subtle blood vessels
  - Realistic catchlights reflecting the environment
- **Nose**: Exact bridge width, tip shape, nostril form
- **Lips**: Precise shape, natural color variation, subtle texture
- **Skin Quality**:
  - Maintain original skin tone and undertone
  - Preserve any natural beauty marks, freckles
  - Realistic pore texture (not plastic smooth)
  - Natural oil/moisture levels appropriate for the lighting
  - Subtle color variation (pinker cheeks, slightly darker around eyes)
- **Expression**: Soft, genuine smile or serene composure - never artificial

### Hair Treatment
- Color: Exact match to Image 1
- Texture: Individual strand detail visible
- Style: Adapt to pose while maintaining natural volume
- Interaction with light: Realistic highlights and shadows

## KIMONO RENDERING - FABRIC EXCELLENCE

### Material Authenticity (from Image 2)
- **Silk Quality**: Visible luminous sheen that shifts with folds
- **Pattern Precision**: Every motif, flower, or geometric shape exactly as shown
- **Color Fidelity**: Rich, deep colors without oversaturation
- **Texture Detail**: Weave pattern visible in close areas
- **Embroidery/Metallic**: If present, realistic thread texture and light reflection

### Construction Accuracy
- **Eri (Collar)**: Clean V-shape, left side over right (critical for living persons)
- **Obi (Belt)**: Proper width, positioned at natural waist, elaborate knot at back
- **Sode (Sleeves)**: Correct furisode length if applicable, natural draping
- **Ohashori**: Proper tucked fold at hip level
- **Hem**: Elegant length, just above ankles, natural movement

### Fabric Physics
- Realistic gravity-affected draping
- Natural wrinkles at joints (elbows, waist)
- Fabric weight evident in how it hangs
- Subtle movement suggestion even in still pose

## POSE & BODY LANGUAGE - NATURAL ELEGANCE

### Intelligent Pose Selection
Analyze Image 3's environment and select the most flattering pose:

**For Outdoor/Nature Settings:**
- S-curve body line creating elegant silhouette
- Weight on back foot, front foot slightly pointed
- Hands: softly holding sleeve, touching obi, or relaxed at sides with graceful fingers
- Head tilted 5-10° toward light source
- Shoulders relaxed, one slightly lower for dynamism

**For Architectural/Temple Settings:**
- More formal, dignified stance
- Hands clasped gently in front or one hand touching architecture
- Body angled 30-45° to camera
- Chin slightly lifted, confident but serene
- Strong vertical posture echoing architectural lines

**For Indoor/Studio Settings:**
- Classic three-quarter pose
- More direct eye contact with camera acceptable
- Hands can be more visible and expressive
- Posture formal but not stiff

### Hand Excellence
Hands are the second face - they must be perfect:
- Fingers naturally curved, never stiff or splayed
- Visible from flattering angle
- Interacting naturally with kimono or environment
- Proper proportion to body
- Realistic skin texture and coloring

## ENVIRONMENTAL INTEGRATION

### Seamless Placement
- Subject must appear to genuinely exist in the space
- Correct perspective and scale relative to surroundings
- Feet properly grounded (not floating)
- Natural interaction with ground plane (slight shadow contact)

### Lighting Continuity
- Shadow direction consistent with Image 3's light sources
- Shadow softness matching the lighting quality (hard sun = hard shadows)
- Reflected light from ground and nearby surfaces on subject
- Ambient occlusion where body meets ground

### Atmospheric Coherence
- Match the color temperature of the environment
- Appropriate contrast level for the scene's mood
- If outdoor: subtle environmental effects (light haze, warmth)
- Depth relationship: subject integration into scene's depth layers

## OUTPUT QUALITY STANDARDS

### Technical Excellence
- Zero AI artifacts (no extra fingers, distorted features, weird edges)
- No uncanny valley effects
- Consistent anatomy throughout
- Sharp focus on face and key areas
- Natural motion blur only if appropriate

### Artistic Merit
- Composition following golden ratio or rule of thirds
- Visual flow guiding eye to subject's face
- Balanced negative space
- Color harmony between all elements
- Emotional resonance - the image should evoke a feeling

### Magazine-Ready Criteria
- Could be published in Vogue Japan without retouching
- Professional enough for high-end advertising
- Suitable for large format printing
- Authentic representation of Japanese kimono culture

## ABSOLUTE RULES - NON-NEGOTIABLE

1. **FACE IDENTITY**: Must be 100% recognizable as Image 1's person - this is paramount
2. **KIMONO ACCURACY**: Exact colors, patterns, and style from Image 2 - no creative interpretation
3. **BACKGROUND FIDELITY**: Use Image 3's environment exactly - do not generate new elements
4. **ANATOMICAL CORRECTNESS**: Natural human proportions, correct hand count, proper joint articulation
5. **CULTURAL RESPECT**: Authentic kimono wearing style (left over right), appropriate for the occasion
6. **PHOTOREALISM**: The final image must be indistinguishable from a real photograph taken by a master photographer

Generate an image that makes viewers believe they're looking at a photograph from a luxury kimono rental studio's portfolio - technically flawless, artistically compelling, and deeply respectful of both the subject and the cultural tradition.`;

/**
 * V3 单轮生成 Prompt - 使用原图作为姿势参考（4图模式）
 *
 * 输入 4 张图片：
 * - Image 1: 用户面部照片
 * - Image 2: 和服图片
 * - Image 3: 原背景图（包含人物，用于姿势参考）
 * - Image 4: 干净背景图（人物已移除）
 *
 * 这种模式更精确，但需要 4 张图片输入。
 */
export const V3_WITH_POSE_REFERENCE_PROMPT = `You are a professional fashion photographer specializing in kimono photography.

## TASK
Create a photorealistic kimono photograph by:
1. Taking the face from Image 1
2. Dressing them in the kimono from Image 2
3. Placing them in the EXACT pose and position as the person in Image 3
4. Using the clean background from Image 4

## INPUT IMAGES
- **Image 1 (FACE SOURCE)**: The person's face - preserve their identity
- **Image 2 (KIMONO SOURCE)**: The kimono outfit to dress them in
- **Image 3 (POSE REFERENCE)**: Reference image showing the EXACT pose, position, and composition to replicate - THIS IS YOUR PRIMARY GUIDE
- **Image 4 (CLEAN BACKGROUND)**: The same scene as Image 3 but without the person

## ⚠️ CRITICAL: POSE AND COMPOSITION REPLICATION (from Image 3)

This is the MOST IMPORTANT requirement. You MUST treat Image 3 as a strict template:

### BODY POSE (COPY PIXEL-PERFECT from Image 3)
- **Arms**: Observe Image 3 carefully - are the hands folded? Holding something? At sides? Arms crossed? COPY EXACTLY
- **Legs**: Same stance, same spacing, same angle
- **Torso**: Same body rotation, same lean direction
- **Head**: Same tilt, same turn angle, same direction of gaze

### FRAME POSITION (MATCH EXACTLY from Image 3)
- Person must be in the EXACT same location within the frame
- If Image 3's person is on the right third → place on right third
- If Image 3's person is centered → place centered
- Same vertical position (headroom and footroom)
- Same scale/distance from camera

### COMPOSITION DETAILS
- Same crop style (full-body, 3/4 body, etc.)
- If Image 3 shows a person holding a bag → generated person should have similar hand position
- If Image 3 shows hands clasped → hands should be clasped
- If Image 3 shows a specific gesture → replicate that gesture

### COMMON MISTAKES TO AVOID
❌ Inventing a different pose
❌ Centering when reference is off-center
❌ Standing straight when reference is tilted
❌ Arms at sides when reference shows folded arms
❌ Different hand positions or gestures

## IDENTITY PRESERVATION (from Image 1)
- Face identity MUST be from Image 1 only
- Keep the person's original expression from Image 1
- Preserve skin tone and facial features exactly
- Hair color from Image 1 (style can adapt to pose)

## KIMONO APPLICATION (from Image 2)
- Preserve EXACT colors, patterns, and design from Image 2
- Proper kimono structure:
  - Collar layered correctly (left over right)
  - Obi (belt) positioned properly
  - Sleeves with correct length and shape
- Natural fabric draping based on the pose from Image 3
- Realistic wrinkles and folds at joints

## BACKGROUND INTEGRATION (from Image 4)
- Use Image 4 as the final background scene
- Match lighting direction from the scene
- Add natural ground shadows matching the light source
- Seamless edge blending

## OUTPUT REQUIREMENTS
- The generated person must look like they could be a traced outline of Image 3's person
- Face from Image 1, recognizable and preserved
- Kimono from Image 2 with exact colors/patterns
- Placed in Image 4's background
- Professional photography quality
- No AI artifacts or unnatural elements`;

// ============================================================================
// LEGACY EXPORTS (向后兼容)
// ============================================================================

/**
 * 默认 Prompt（向后兼容别名）
 * @deprecated Use UNIFIED_TRYON_PROMPT for single-round, or ROUND1/ROUND2 for two-round mode
 */
export const DEFAULT_PROMPT = UNIFIED_TRYON_PROMPT;
