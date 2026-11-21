import type { StaticImageData } from "next/image";

import heroLoma from "@/assets/site/hero/hero-loma.jpg";
import wallWide from "@/assets/site/hero/wall-wide.jpg";

import aun from "@/assets/site/trainers/aun.jpg";
import boy from "@/assets/site/trainers/boy.jpg";
import jame from "@/assets/site/trainers/jame.jpg";
import jeeno from "@/assets/site/trainers/jeeno.jpg";
import loma from "@/assets/site/trainers/loma.jpg";
import pure from "@/assets/site/trainers/pure.jpg";
import sammy from "@/assets/site/trainers/sammy.jpg";
import tar from "@/assets/site/trainers/tar.jpg";

import gymWallFloor from "@/assets/site/gym/wall-floor.jpg";
import gymDumbbells from "@/assets/site/gym/dumbbells.jpg";
import gymLegPress from "@/assets/site/gym/leg-press.jpg";
import gymChestPress from "@/assets/site/gym/chest-press.jpg";
import gymEzBars from "@/assets/site/gym/ez-bars.jpg";
import gymSkiErg from "@/assets/site/gym/skierg.jpg";
import gymGlute from "@/assets/site/gym/glute.jpg";

import classGroup from "@/assets/site/community/class-group.jpg";
import classRowers from "@/assets/site/community/class-rowers.jpg";
import classCircle from "@/assets/site/community/class-circle.jpg";
import classSandbag from "@/assets/site/community/class-sandbag.jpg";

import eventSandbag from "@/assets/site/community/event-sandbag.jpg";
import eventErg from "@/assets/site/community/event-erg.jpg";
import eventSled from "@/assets/site/community/event-sled.jpg";
import eventRope from "@/assets/site/community/event-rope.jpg";
import eventCarry from "@/assets/site/community/event-carry.jpg";
import eventSmile from "@/assets/site/community/event-smile.jpg";
import eventJump from "@/assets/site/community/event-jump.jpg";
import eventSlamball from "@/assets/site/community/event-slamball.jpg";

import result01 from "@/assets/site/results/result-01.jpg";
import result02 from "@/assets/site/results/result-02.jpg";
import result03 from "@/assets/site/results/result-03.jpg";
import result04 from "@/assets/site/results/result-04.jpg";
import result05 from "@/assets/site/results/result-05.jpg";
import result06 from "@/assets/site/results/result-06.jpg";
import result07 from "@/assets/site/results/result-07.jpg";
import result08 from "@/assets/site/results/result-08.jpg";

export interface Photo {
  src: StaticImageData;
  alt: string;
  /** CSS object-position for cropped tiles, when the subject is off-centre. */
  position?: string;
}

export const hero: Photo = {
  src: heroLoma,
  alt: "เทรนเนอร์ S365 เดินถือเคตเทิลเบลล์สองข้างบนลู่หญ้าเทียมในยิม",
};

export const wall: Photo = {
  src: wallWide,
  alt: "โซนเครื่องเวทของ S365 Fitness กับผนังตัวเลข 0123465789 ที่เลข 3 6 5 เป็นสีเหลือง",
};

export const trainers: (Photo & { name: string })[] = [
  { name: "Aun", src: aun, alt: "PT Aun กำลังยกบาร์เบลล์ในแร็ก" },
  { name: "Boy", src: boy, alt: "PT Boy กำลังฝึกดัมเบลล์โรว์" },
  { name: "Jame", src: jame, alt: "PT Jame กำลังดันสเลดบนลู่หญ้าเทียม" },
  { name: "Jeeno", src: jeeno, alt: "PT Jeeno ถือเมดิซินบอล" },
  { name: "Loma", src: loma, alt: "PT Loma เดินถือเคตเทิลเบลล์สองข้าง" },
  { name: "Pure", src: pure, alt: "PT Pure แบกแซนด์แบ็กทำท่าลันจ์" },
  { name: "Sammy", src: sammy, alt: "PT Sammy กำลังเหวี่ยงแบตเทิลโรป" },
  { name: "Tar", src: tar, alt: "PT Tar ยืนกอดอกหน้าแร็ก" },
];

export const gymPhotos: Photo[] = [
  { src: gymDumbbells, alt: "ชั้นวางดัมเบลล์เรียงยาวในโซนฟรีเวท" },
  { src: gymWallFloor, alt: "โซนเครื่องเวทและผนังตัวเลขของยิม" },
  { src: gymLegPress, alt: "เครื่องเลกเพรสแบบใส่แผ่นน้ำหนัก" },
  { src: gymChestPress, alt: "เครื่องเชสต์เพรส" },
  { src: gymEzBars, alt: "ชั้นวาง EZ bar น้ำหนัก 15 ถึง 25 กิโลกรัม" },
  { src: gymSkiErg, alt: "เครื่อง SkiErg สองเครื่องริมหน้าต่าง" },
  { src: gymGlute, alt: "เครื่องฝึกกล้ามเนื้อสะโพก" },
];

// One photo per gym zone, in the same order as `zones` in site.ts.
export const zonePhotos: Photo[] = [
  { src: gymChestPress, alt: "เครื่องเชสต์เพรสในโซนแมชชีน" },
  { src: gymDumbbells, alt: "ชั้นวางดัมเบลล์เรียงยาวในโซนฟรีเวท" },
  { src: heroLoma, alt: "เทรนเนอร์ S365 เดินถือเคตเทิลเบลล์สองข้างบนลู่หญ้าเทียม", position: "55% 45%" },
  { src: gymSkiErg, alt: "เครื่อง SkiErg สองเครื่องริมหน้าต่าง" },
];

// The three photos shown in the community section: one at the gym, two from race day.
export const communityHighlights: Photo[] = [
  { src: classGroup, alt: "สมาชิกและเทรนเนอร์ถ่ายรูปหมู่หลังคลาสหน้าโลโก้ S365 Fitness" },
  { src: eventSled, alt: "นักกีฬาทีม S365 ดันสเลดในสนามแข่ง HYROX", position: "50% 20%" },
  { src: eventJump, alt: "สมาชิกทีม S365 กระโดดฉลองหน้าป้ายเวลาเข้าเส้นชัย HYROX" },
];

export const classPhotos: Photo[] = [
  { src: classGroup, alt: "สมาชิกและเทรนเนอร์ถ่ายรูปหมู่หลังคลาสหน้าโลโก้ S365 Fitness" },
  { src: classRowers, alt: "สมาชิกฝึกเครื่องกรรเชียงบกในเซสชันกลุ่ม" },
  { src: classCircle, alt: "สมาชิกนั่งล้อมวงยืดเหยียดหลังเซสชันกลุ่ม" },
  { src: classSandbag, alt: "สมาชิกฝึกยกแซนด์แบ็กในเซสชันกลุ่ม" },
];

// Ordered so the masonry columns come out at similar heights (tall + wide pairs).
export const eventPhotos: Photo[] = [
  { src: eventSled, alt: "นักกีฬาทีม S365 ดันสเลดในสนามแข่ง HYROX" },
  { src: eventErg, alt: "นักกีฬาทีม S365 บนเครื่องเอิร์กในสนามแข่ง DEKA" },
  { src: eventSandbag, alt: "นักกีฬาทีม S365 แบกแซนด์แบ็กทำท่าลันจ์ในสนามแข่ง" },
  { src: eventRope, alt: "นักกีฬาทีม S365 ดึงเชือกสเลดในสนามแข่ง HYROX" },
  { src: eventSmile, alt: "สมาชิกทีม S365 ยิ้มถือของที่ระลึก HYROX Bangkok" },
  { src: eventCarry, alt: "นักกีฬาทีม S365 เดินถือเคตเทิลเบลล์ในด่าน Farmers Carry" },
  { src: eventSlamball, alt: "นักกีฬาทีม S365 ยกสแลมบอลในสนามแข่ง DEKA FIT" },
  { src: eventJump, alt: "สมาชิกทีม S365 กระโดดฉลองหน้าป้ายเวลาเข้าเส้นชัย HYROX" },
];

export const results: Photo[] = [
  { src: result01, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Jeeno ระยะเวลา 4 เดือน" },
  { src: result02, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Sammy น้ำหนักจาก 130 เหลือ 121 กิโลกรัม" },
  { src: result03, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Aun ตั้งแต่เดือนที่ 2 ถึงเดือนที่ 8" },
  { src: result04, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Boy ระยะเวลา 3 เดือน" },
  { src: result05, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Boy ระยะเวลา 3 เดือน" },
  { src: result06, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Jeeno ระยะเวลา 6 เดือน" },
  { src: result07, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Jeeno ระยะเวลา 8 เดือน" },
  { src: result08, alt: "ผลลัพธ์ก่อนและหลังของสมาชิก โปรแกรมโดย PT Sammy ระยะเวลา 4 เดือน" },
];
