export default function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="sectionHeader">
      {eyebrow ? <p className="sectionEyebrow">{eyebrow}</p> : null}
      <h2 className="sectionTitle">{title}</h2>
      {subtitle ? <p className="sectionSubtitle">{subtitle}</p> : null}
    </div>
  );
}