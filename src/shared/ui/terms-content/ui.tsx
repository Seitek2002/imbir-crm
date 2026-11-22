import { BRAND } from "../../config/brand";
import { useT } from "../../lib/i18n";

/** Текст «Условий использования» — общий для входа и профиля */
export function TermsContent() {
  const t = useT();
  return (
    <article className="selectable pb-4 text-[0.9375rem] leading-relaxed text-fg">
      <p className="text-[0.8125rem] text-fg-2">{t.terms.meta}</p>
      <hr className="my-4 border-separator" />
      <h3 className="text-[0.9375rem] font-bold tracking-wide">
        {t.terms.heading}
      </h3>
      <p className="text-fg-2">{t.terms.intro}</p>
      <p className="mt-3 text-fg-2">{t.terms.place}</p>
      {t.terms.sections.map((s) => (
        <section key={s.title} className="mt-5">
          <h4 className="mb-2 font-bold">{s.title}</h4>
          {s.items.map((item) => (
            <p key={item.slice(0, 24)} className="mb-2.5 text-fg-2">
              <b className="font-semibold text-fg">{item.split(" ")[0]}</b>{" "}
              {item.split(" ").slice(1).join(" ")}
            </p>
          ))}
        </section>
      ))}
      <p className="mt-5 font-semibold">{t.terms.rights}</p>
      <p className="mt-2 text-fg-2">{BRAND.supportEmail}</p>
      <p className="mt-4 text-center text-fg-2">
        {t.terms.contact}{" "}
        <a
          href={`mailto:${BRAND.supportEmail}`}
          className="text-primary underline"
        >
          {BRAND.supportEmail}
        </a>
      </p>
    </article>
  );
}
