import type { Locale } from "./site-texts";

type Text = Record<Locale, string>;

export interface GuideItem {
  id: string;
  name: Text;
  /** Muscles worked or the area stretched. */
  area: Text;
  /** How much to do. */
  dose: Text;
  steps: Record<Locale, string[]>;
  /** The most common mistake, or what to watch for. */
  watch: Text;
}

// Item 5: basic exercises that need no equipment.
export const homeExercises: GuideItem[] = [
  {
    id: "squat",
    name: { th: "สควอต", en: "Bodyweight squat" },
    area: { th: "ต้นขา สะโพก", en: "Thighs, glutes" },
    dose: { th: "3 เซต เซตละ 12 ถึง 15 ครั้ง", en: "3 sets of 12 to 15" },
    steps: {
      th: ["ยืนเท้ากว้างเท่าไหล่ ปลายเท้าเปิดออกเล็กน้อย", "ดันสะโพกไปด้านหลังแล้วย่อลงเหมือนนั่งเก้าอี้ หลังตรง อกเปิด", "ย่อจนต้นขาขนานพื้นหรือเท่าที่ทำได้โดยส้นเท้าไม่ลอย", "ออกแรงที่ส้นเท้า ดันตัวกลับขึ้นมายืนตรง"],
      en: ["Stand with feet shoulder-width apart, toes turned out slightly.", "Push your hips back and lower as if sitting on a chair, back straight and chest open.", "Go down until your thighs are parallel to the floor, or as far as you can with heels down.", "Drive through your heels to stand back up."],
    },
    watch: { th: "อย่าให้เข่าหุบเข้าหากัน ให้เข่าชี้ไปทางเดียวกับปลายเท้า", en: "Do not let your knees cave inward. Keep them pointing the same way as your toes." },
  },
  {
    id: "reverse-lunge",
    name: { th: "รีเวิร์สลันจ์", en: "Reverse lunge" },
    area: { th: "ต้นขา สะโพก การทรงตัว", en: "Thighs, glutes, balance" },
    dose: { th: "3 เซต ข้างละ 10 ครั้ง", en: "3 sets of 10 each side" },
    steps: {
      th: ["ยืนตรง มือเท้าเอวหรือประสานไว้หน้าอก", "ก้าวขาข้างหนึ่งไปด้านหลัง แล้วย่อเข่าทั้งสองข้างลงประมาณ 90 องศา", "ลำตัวตั้งตรง เข่าหลังเกือบแตะพื้น", "ออกแรงที่ขาหน้า ดึงขาหลังกลับมายืนที่เดิม แล้วสลับข้าง"],
      en: ["Stand tall, hands on hips or clasped at your chest.", "Step one leg back and bend both knees to about 90 degrees.", "Keep your torso upright, back knee just above the floor.", "Push through the front leg to return, then switch sides."],
    },
    watch: { th: "ก้าวให้ยาวพอ ถ้าก้าวสั้นเกินไปน้ำหนักจะลงที่เข่าหน้า", en: "Step back far enough. A short step puts the load on your front knee." },
  },
  {
    id: "glute-bridge",
    name: { th: "กลูตบริดจ์", en: "Glute bridge" },
    area: { th: "สะโพก ต้นขาด้านหลัง", en: "Glutes, hamstrings" },
    dose: { th: "3 เซต เซตละ 15 ครั้ง", en: "3 sets of 15" },
    steps: {
      th: ["นอนหงาย ชันเข่า เท้าวางกว้างเท่าสะโพก แขนวางข้างลำตัว", "เกร็งหน้าท้อง แล้วดันสะโพกขึ้นจนไหล่ สะโพก และเข่าอยู่ในแนวเดียวกัน", "บีบก้นค้างไว้ 1 วินาที", "ลดสะโพกลงช้าๆ จนเกือบแตะพื้น แล้วทำต่อ"],
      en: ["Lie on your back with knees bent, feet hip-width apart, arms by your sides.", "Brace your stomach and lift your hips until shoulders, hips and knees form a line.", "Squeeze your glutes for one second.", "Lower slowly until your hips almost touch the floor, then repeat."],
    },
    watch: { th: "อย่าแอ่นหลังเพื่อยกให้สูงขึ้น ให้แรงมาจากก้น", en: "Do not arch your lower back to get higher. The lift should come from your glutes." },
  },
  {
    id: "push-up",
    name: { th: "วิดพื้น", en: "Push-up" },
    area: { th: "อก ไหล่ หลังแขน", en: "Chest, shoulders, triceps" },
    dose: { th: "3 เซต เซตละ 8 ถึง 12 ครั้ง", en: "3 sets of 8 to 12" },
    steps: {
      th: ["วางมือกว้างกว่าไหล่เล็กน้อย เหยียดขาไปด้านหลัง ลำตัวเป็นเส้นตรง", "งอศอกลดตัวลงจนอกเกือบแตะพื้น ศอกทำมุมประมาณ 45 องศากับลำตัว", "ดันพื้นกลับขึ้นมาจนแขนตึง", "ถ้ายังทำไม่ไหว ให้วางเข่าลงกับพื้น หรือวางมือบนเก้าอี้ที่มั่นคง"],
      en: ["Place your hands slightly wider than your shoulders, legs straight back, body in one line.", "Bend your elbows and lower until your chest nearly touches the floor, elbows about 45 degrees from your body.", "Push the floor away until your arms are straight.", "If that is too hard, put your knees down or place your hands on a sturdy chair."],
    },
    watch: { th: "อย่าให้สะโพกตกหรือยกก้นสูง เกร็งหน้าท้องตลอดการเคลื่อนไหว", en: "Do not let your hips sag or pike up. Keep your stomach braced throughout." },
  },
  {
    id: "plank",
    name: { th: "แพลงก์", en: "Plank" },
    area: { th: "หน้าท้อง แกนกลางลำตัว", en: "Abs, core" },
    dose: { th: "3 เซต ค้างเซตละ 30 ถึง 45 วินาที", en: "3 holds of 30 to 45 seconds" },
    steps: {
      th: ["วางปลายแขนลงกับพื้น ศอกอยู่ใต้ไหล่", "เหยียดขาไปด้านหลัง ยกตัวขึ้นให้ศีรษะ หลัง และส้นเท้าเป็นเส้นตรง", "เกร็งหน้าท้องและก้น หายใจตามปกติ", "ค้างไว้ตามเวลา ถ้าท่าเริ่มเสียให้หยุดพัก"],
      en: ["Rest your forearms on the floor with elbows under your shoulders.", "Extend your legs and lift so that head, back and heels form a straight line.", "Brace your stomach and glutes and breathe normally.", "Hold for the time. Stop and rest once your form starts to slip."],
    },
    watch: { th: "อย่ากลั้นหายใจ และอย่าปล่อยให้หลังส่วนล่างแอ่น", en: "Do not hold your breath, and do not let your lower back sag." },
  },
  {
    id: "superman",
    name: { th: "ซูเปอร์แมน", en: "Superman" },
    area: { th: "หลังส่วนล่าง สะโพก", en: "Lower back, glutes" },
    dose: { th: "3 เซต เซตละ 12 ครั้ง", en: "3 sets of 12" },
    steps: {
      th: ["นอนคว่ำ เหยียดแขนไปเหนือศีรษะ ขาเหยียดตรง", "ยกแขน อก และขาขึ้นจากพื้นพร้อมกันเล็กน้อย", "ค้างไว้ 2 วินาที สายตามองพื้น", "ลดตัวลงช้าๆ แล้วทำต่อ"],
      en: ["Lie face down with arms stretched overhead and legs straight.", "Lift your arms, chest and legs a little off the floor at the same time.", "Hold for two seconds, eyes on the floor.", "Lower slowly and repeat."],
    },
    watch: { th: "ยกแค่พอรู้สึกที่หลังและก้น ไม่ต้องยกให้สูง และอย่าเงยคอ", en: "Lift only until you feel your back and glutes working. No need to go high, and do not crane your neck." },
  },
  {
    id: "bird-dog",
    name: { th: "เบิร์ดด็อก", en: "Bird dog" },
    area: { th: "แกนกลางลำตัว หลัง การทรงตัว", en: "Core, back, balance" },
    dose: { th: "3 เซต ข้างละ 10 ครั้ง", en: "3 sets of 10 each side" },
    steps: {
      th: ["ตั้งท่าคลาน มืออยู่ใต้ไหล่ เข่าอยู่ใต้สะโพก", "เหยียดแขนขวาไปด้านหน้าและขาซ้ายไปด้านหลังพร้อมกัน จนขนานกับพื้น", "ค้างไว้ 2 วินาที ลำตัวนิ่ง ไม่บิด", "กลับมาท่าเริ่ม แล้วสลับข้าง"],
      en: ["Start on hands and knees, hands under shoulders and knees under hips.", "Reach your right arm forward and left leg back together until both are level with the floor.", "Hold for two seconds with your torso still, no twisting.", "Return to the start and switch sides."],
    },
    watch: { th: "ทำช้าๆ ถ้าสะโพกเอียงแสดงว่าเร็วเกินไป", en: "Move slowly. If your hips tilt, you are going too fast." },
  },
  {
    id: "mountain-climber",
    name: { th: "เมาน์เทนไคลม์เบอร์", en: "Mountain climber" },
    area: { th: "ทั้งตัว หัวใจและปอด", en: "Whole body, heart and lungs" },
    dose: { th: "3 เซต เซตละ 30 วินาที", en: "3 sets of 30 seconds" },
    steps: {
      th: ["ตั้งท่าวิดพื้น แขนตึง มืออยู่ใต้ไหล่", "ดึงเข่าขวาเข้าหาอก แล้วเหยียดกลับ", "สลับดึงเข่าซ้ายทันที ทำต่อเนื่องเหมือนวิ่งอยู่กับที่", "เริ่มจากจังหวะช้า แล้วค่อยเร่งเมื่อคุมท่าได้"],
      en: ["Start in a push-up position with arms straight and hands under shoulders.", "Pull your right knee toward your chest, then send it back.", "Switch to the left knee straight away, as if running in place.", "Start slowly and speed up once your form is steady."],
    },
    watch: { th: "อย่ายกก้นสูง ให้สะโพกอยู่ระดับเดียวกับไหล่", en: "Do not let your hips rise. Keep them level with your shoulders." },
  },
];

// Item 6: stretches for after training, one body area each.
export const stretches: GuideItem[] = [
  {
    id: "neck",
    name: { th: "ยืดคอด้านข้าง", en: "Side neck stretch" },
    area: { th: "คอ บ่า", en: "Neck, upper traps" },
    dose: { th: "ข้างละ 20 ถึง 30 วินาที 2 รอบ", en: "20 to 30 seconds each side, twice" },
    steps: {
      th: ["นั่งหรือยืนหลังตรง ปล่อยไหล่ลง", "เอียงศีรษะไปทางขวา ให้หูเข้าใกล้ไหล่", "ใช้มือขวาวางบนศีรษะเบาๆ เพื่อเพิ่มแรงยืดเล็กน้อย", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Sit or stand tall and let your shoulders drop.", "Tilt your head to the right, ear toward shoulder.", "Rest your right hand lightly on your head to add a little stretch.", "Hold, then switch sides."],
    },
    watch: { th: "ห้ามดึงศีรษะแรง ใช้แค่น้ำหนักของมือ", en: "Never pull hard on your head. The weight of your hand is enough." },
  },
  {
    id: "shoulder",
    name: { th: "ยืดไหล่ไขว้แขน", en: "Cross-body shoulder stretch" },
    area: { th: "ไหล่ด้านหลัง", en: "Rear shoulder" },
    dose: { th: "ข้างละ 20 ถึง 30 วินาที 2 รอบ", en: "20 to 30 seconds each side, twice" },
    steps: {
      th: ["ยืนตรง ยกแขนขวาขึ้นระดับอก", "ใช้แขนซ้ายโอบแขนขวาเหนือข้อศอก แล้วดึงเข้าหาลำตัว", "ไหล่ไม่ยกขึ้น ลำตัวไม่บิด", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Stand tall and raise your right arm to chest height.", "Hook your left arm around it above the elbow and draw it toward your body.", "Keep the shoulder down and your torso square.", "Hold, then switch sides."],
    },
    watch: { th: "อย่าดึงที่ข้อศอกโดยตรง ให้จับเหนือหรือใต้ข้อศอก", en: "Do not pull on the elbow joint itself. Hold just above or below it." },
  },
  {
    id: "chest",
    name: { th: "ยืดอกกับผนัง", en: "Wall chest stretch" },
    area: { th: "อก ไหล่ด้านหน้า", en: "Chest, front shoulder" },
    dose: { th: "ข้างละ 20 ถึง 30 วินาที 2 รอบ", en: "20 to 30 seconds each side, twice" },
    steps: {
      th: ["ยืนข้างผนังหรือเสา วางฝ่ามือและปลายแขนขวาบนผนัง ศอกสูงระดับไหล่", "ก้าวเท้าขวาไปข้างหน้าเล็กน้อย", "ค่อยๆ หมุนลำตัวออกจากผนังจนรู้สึกตึงที่อก", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Stand beside a wall or post and place your right palm and forearm on it, elbow at shoulder height.", "Take a small step forward with your right foot.", "Slowly turn your body away from the wall until you feel your chest stretch.", "Hold, then switch sides."],
    },
    watch: { th: "ถ้ารู้สึกเจ็บที่หัวไหล่ ให้ลดศอกลงต่ำกว่าระดับไหล่", en: "If you feel pain in the shoulder joint, lower your elbow below shoulder height." },
  },
  {
    id: "upper-back",
    name: { th: "ท่าเด็กหมอบ", en: "Child's pose" },
    area: { th: "หลังส่วนบน หลังส่วนล่าง", en: "Upper and lower back" },
    dose: { th: "ค้าง 30 ถึง 45 วินาที 2 รอบ", en: "30 to 45 seconds, twice" },
    steps: {
      th: ["คุกเข่า นั่งทับส้นเท้า แยกเข่าออกเล็กน้อย", "โน้มตัวไปด้านหน้า เหยียดแขนไปไกลที่สุด หน้าผากแตะพื้น", "หายใจลึกๆ ปล่อยให้หลังยืดออก", "ค่อยๆ ลุกกลับขึ้นมา"],
      en: ["Kneel and sit back on your heels with knees slightly apart.", "Fold forward and reach your arms as far as you can, forehead to the floor.", "Breathe deeply and let your back lengthen.", "Come back up slowly."],
    },
    watch: { th: "ถ้าเข่าไม่สบาย ให้วางผ้าหรือหมอนไว้ใต้เข่าหรือระหว่างก้นกับส้นเท้า", en: "If your knees are uncomfortable, put a towel or cushion under them or between hips and heels." },
  },
  {
    id: "lower-back",
    name: { th: "กอดเข่าชิดอก", en: "Knee to chest" },
    area: { th: "หลังส่วนล่าง สะโพก", en: "Lower back, glutes" },
    dose: { th: "ข้างละ 20 ถึง 30 วินาที 2 รอบ", en: "20 to 30 seconds each side, twice" },
    steps: {
      th: ["นอนหงาย ขาเหยียดตรง", "งอเข่าขวา ใช้มือทั้งสองข้างกอดเข่าดึงเข้าหาอก", "ขาอีกข้างเหยียดติดพื้น ศีรษะและไหล่ผ่อนคลาย", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Lie on your back with legs straight.", "Bend your right knee and hug it toward your chest with both hands.", "Keep the other leg flat and your head and shoulders relaxed.", "Hold, then switch sides."],
    },
    watch: { th: "อย่ายกศีรษะขึ้นมาหาเข่า ให้ดึงเข่าเข้าหาตัวแทน", en: "Do not lift your head toward the knee. Bring the knee to you instead." },
  },
  {
    id: "hips",
    name: { th: "ยืดสะโพกเลขสี่", en: "Figure-four hip stretch" },
    area: { th: "สะโพก ก้น", en: "Hips, glutes" },
    dose: { th: "ข้างละ 30 วินาที 2 รอบ", en: "30 seconds each side, twice" },
    steps: {
      th: ["นอนหงาย ชันเข่าทั้งสองข้าง", "ยกข้อเท้าขวามาวางบนเข่าซ้าย เป็นรูปเลข 4", "สอดมือจับหลังต้นขาซ้าย แล้วดึงเข้าหาอก", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Lie on your back with both knees bent.", "Rest your right ankle on your left knee to make a figure four.", "Reach through, hold the back of your left thigh and draw it toward your chest.", "Hold, then switch sides."],
    },
    watch: { th: "ควรรู้สึกตึงที่ก้น ไม่ใช่ที่เข่า ถ้าเจ็บเข่าให้ผ่อนแรงดึง", en: "You should feel it in the glute, not the knee. Ease off if the knee hurts." },
  },
  {
    id: "quads",
    name: { th: "ยืดต้นขาด้านหน้า", en: "Standing quad stretch" },
    area: { th: "ต้นขาด้านหน้า", en: "Front of thigh" },
    dose: { th: "ข้างละ 20 ถึง 30 วินาที 2 รอบ", en: "20 to 30 seconds each side, twice" },
    steps: {
      th: ["ยืนตรง ใช้มือซ้ายจับผนังหรือเก้าอี้เพื่อทรงตัว", "งอเข่าขวา ใช้มือขวาจับข้อเท้าดึงส้นเท้าเข้าหาก้น", "เข่าทั้งสองข้างอยู่ชิดกัน ดันสะโพกไปด้านหน้าเล็กน้อย", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Stand tall and hold a wall or chair with your left hand for balance.", "Bend your right knee and pull your heel toward your glute with your right hand.", "Keep your knees together and press your hips slightly forward.", "Hold, then switch sides."],
    },
    watch: { th: "อย่าแอ่นหลัง ให้เกร็งหน้าท้องไว้", en: "Do not arch your back. Keep your stomach braced." },
  },
  {
    id: "hamstrings",
    name: { th: "ยืดต้นขาด้านหลัง", en: "Seated hamstring stretch" },
    area: { th: "ต้นขาด้านหลัง", en: "Back of thigh" },
    dose: { th: "ข้างละ 20 ถึง 30 วินาที 2 รอบ", en: "20 to 30 seconds each side, twice" },
    steps: {
      th: ["นั่งกับพื้น เหยียดขาขวาตรง งอขาซ้ายให้ฝ่าเท้าแตะต้นขาขวา", "หลังตรง โน้มตัวจากสะโพกไปหาปลายเท้าขวา", "เอื้อมมือไปเท่าที่ถึง ไม่ต้องแตะปลายเท้า", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Sit on the floor with your right leg straight and your left foot against your right thigh.", "With a straight back, hinge from the hips toward your right foot.", "Reach as far as is comfortable. You do not need to touch your toes.", "Hold, then switch sides."],
    },
    watch: { th: "อย่างอหลังเพื่อให้เอื้อมถึง ให้โน้มจากสะโพก", en: "Do not round your back to reach further. Hinge from the hips." },
  },
  {
    id: "calves",
    name: { th: "ยืดน่องกับผนัง", en: "Wall calf stretch" },
    area: { th: "น่อง", en: "Calves" },
    dose: { th: "ข้างละ 20 ถึง 30 วินาที 2 รอบ", en: "20 to 30 seconds each side, twice" },
    steps: {
      th: ["ยืนหันหน้าเข้าผนัง วางมือบนผนังระดับอก", "ก้าวขาขวาไปด้านหลัง ขาตึง ส้นเท้าแตะพื้น", "งอเข่าซ้ายแล้วโน้มตัวเข้าหาผนังจนรู้สึกตึงที่น่องขวา", "ค้างไว้ แล้วสลับข้าง"],
      en: ["Face a wall and place your hands on it at chest height.", "Step your right leg back, leg straight and heel on the floor.", "Bend your left knee and lean in until you feel your right calf stretch.", "Hold, then switch sides."],
    },
    watch: { th: "ปลายเท้าหลังชี้ตรงไปด้านหน้า ไม่เปิดออกด้านข้าง", en: "Point the back foot straight ahead, not out to the side." },
  },
];

export const guideIntro: Record<"home" | "stretch", { rules: Record<Locale, string[]> }> = {
  home: {
    rules: {
      th: ["อบอุ่นร่างกาย 5 นาทีก่อนเริ่ม เช่น เดินอยู่กับที่หรือแกว่งแขน", "เลือก 5 ถึง 6 ท่า ทำ 2 ถึง 3 วันต่อสัปดาห์ เว้นวันพักระหว่างวันฝึก", "พักระหว่างเซต 45 ถึง 60 วินาที", "ทำช้าๆ คุมท่าให้ถูกก่อนเพิ่มจำนวนครั้ง"],
      en: ["Warm up for 5 minutes first: march in place or swing your arms.", "Pick 5 or 6 moves and train 2 to 3 days a week with a rest day in between.", "Rest 45 to 60 seconds between sets.", "Move slowly and get the form right before adding reps."],
    },
  },
  stretch: {
    rules: {
      th: ["ยืดหลังออกกำลังกาย ตอนที่กล้ามเนื้อยังอุ่นอยู่", "ยืดจนรู้สึกตึง ไม่ใช่เจ็บ แล้วค้างนิ่งๆ ไม่โยกหรือกระตุก", "หายใจช้าและลึกตลอดการยืด", "ทำครบทั้งสองข้างทุกท่า"],
      en: ["Stretch after training, while your muscles are still warm.", "Go until you feel tension, not pain, and hold still. Do not bounce.", "Breathe slowly and deeply throughout.", "Do both sides for every stretch."],
    },
  },
};
