/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Prompt Optimizer & Engineering Intent Learning Loop (M06)
 */

export interface PromptTemplate {
  id: string;
  categoryFa: string;
  titleFa: string;
  templateTextFa: string;
  modelTarget: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
  thinkingLevelHigh: boolean;
  useSearchGrounding: boolean;
  score: number;
}

export const PRESET_PROMPTS: PromptTemplate[] = [
  {
    id: 'pmt-drift-remedy',
    categoryFa: 'کنترل دریفت و پایداری لرزه‌ای',
    titleFa: 'تحلیل دریفت طبقات بحرانی و پیشنهاد بهینه‌سازی دیوار برشی',
    templateTextFa: `بررسی جامع تغییرمکان جانبی نسبی طبقات (Story Drift Ratio) در تمام طبقات سازه بر اساس استاندارد ۲۸۰۰ ویرایش ۴. در صورتی که در طبقات ۵ الی ۸ نسبت دریفت به حد مجاز ۰٫۰۲۰ نزدیک یا فراتر رفته باشد، موقعیت و ضخامت دیوارهای برشی هسته را بهینه‌سازی نما و مقادیر جدید را به فرمت CSM برگردان.`,
    modelTarget: 'gemini-4-argon',
    thinkingLevelHigh: true,
    useSearchGrounding: false,
    score: 96,
  },
  {
    id: 'pmt-col-rebar-opt',
    categoryFa: 'طراحی مقاطع و درصد آرماتور',
    titleFa: 'بهینه‌سازی مقاطع ستون‌ها و نگه‌داشتن درصد فولاد بین ۱٫۲٪ تا ۲٫۵٪',
    templateTextFa: `ستون‌های طبقات ۱ تا ۴ را بر اساس ترکیبات بارگذاری متعامد لرزه‌ای بررسی کن. مقاطع با نسبت D/C کمتر از ۰٫۶۵ را جهت صرفه‌جویی اقتصادی تا ۱۰ سانتی‌متر کوچک‌تر کن مشروط بر اینکه درصد آرماتور طولی از ۲٫۵٪ بیشتر نشده و ضوابط مبحث نهم ارضا گردد.`,
    modelTarget: 'gemini-4-argon',
    thinkingLevelHigh: true,
    useSearchGrounding: false,
    score: 94,
  },
  {
    id: 'pmt-standards-search',
    categoryFa: 'استعلام آنلاین ضوابط و مصوبات',
    titleFa: 'استعلام آخرین ضوابط زلزله و پیوست ششم استاندارد ۲۸۰۰ با جستجوی وب',
    templateTextFa: `با استفاده از جستجوی به‌روز وب، آخرین تغییرات و ضوابط پیوست ششم آیین‌نامه ۲۸۰۰ در خصوص دیوارهای غیرسازه‌ای و مهار لرزه‌ای وال‌پست‌های نوین را استخراج کرده و چک‌لیست الزامات اجرایی برای این پروژه را تدوین نما.`,
    modelTarget: 'gemini-3.8-flash',
    thinkingLevelHigh: false,
    useSearchGrounding: true,
    score: 92,
  },
  {
    id: 'pmt-mate-detailing',
    categoryFa: 'ارسال دستورات به ETABS MATE',
    titleFa: 'تیپ‌بندی و ترسیم نقشه‌های پالت خاموت‌گذاری ستون‌ها در ETABS MATE',
    templateTextFa: `نتایج طراحی آرماتورهای طولی و برشی ستون‌های سازه را استخراج کرده و پالت خاموت‌گذاری متراکم در نواحی بحرانی پای ستون (فاصله ۱۰ سانتی‌متر) و ناحیه میانی را برای نرم‌افزار ETABS MATE شیت‌بندی نما.`,
    modelTarget: 'gemini-3.8-flash',
    thinkingLevelHigh: false,
    useSearchGrounding: false,
    score: 95,
  },
  {
    id: 'pmt-boq-audit',
    categoryFa: 'متره و برآورد اقتصادی',
    titleFa: 'محاسبه فوری متره مصالح، وزن کل میلگرد و مقایسه با میانگین متراژ',
    templateTextFa: `لیست مقادیر (BoQ) مصالح شامل حجم کل بتن و تناژ میلگرد به تفکیک سایز را محاسبه کن. سپس شاخص مصرف میلگرد بر حسب کیلوگرم بر مترمربع زیربنا را با میانگین متعارف پروژه‌های مسکونی در تهران (۴۵ الی ۵۵ کیلوگرم بر مترمربع) مقایسه کن.`,
    modelTarget: 'gemini-3.1-flash-lite',
    thinkingLevelHigh: false,
    useSearchGrounding: false,
    score: 90,
  },
];

export function generateCandidateVariations(seedPrompt: string): { prompt: string; estimatedScore: number; rationale: string }[] {
  return [
    {
      prompt: `${seedPrompt}\n[الزام فنی: فرمت خروجی دقیقاً مطابق فیلدهای مدل CSM و با ذکر بندهای استاندارد ۲۸۰۰ ویرایش ۴ تدوین گردد.]`,
      estimatedScore: 97,
      rationale: 'افزودن قید خروجی ساختاریافته CSM و ارجاع صریح به بندهای استاندارد ۲۸۰۰ نرخ خطای پارس را ۹۸٪ کاهش می‌دهد.',
    },
    {
      prompt: `${seedPrompt}\n[محدودیت اقتصادی: کنترل سقف بودجه توکن و تفکیک اولویت‌های تغییر مقطع تیرها و ستون‌ها.]`,
      estimatedScore: 92,
      rationale: 'تمرکز بر مقاطع بحرانی با نسبت D/C > 0.85 جهت بهینه‌سازی زمان استنتاج مدل.',
    },
    {
      prompt: `${seedPrompt}\n[کنترل ایمنی مضاعف: لحاظ کردن بررسی تعادل استاتیکی ΣFz=W پس از هر تغییر.]`,
      estimatedScore: 95,
      rationale: 'تضمین پایداری و مهار خطاهای خاموش (Silent Error Prevention).',
    },
  ];
}
