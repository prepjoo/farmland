export default function ChipGroup({ label, options, value, onChange, name }) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="chips" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            type="button"
            key={o.id}
            role="radio"
            aria-checked={value === o.id}
            className={value === o.id ? 'on' : ''}
            onClick={() => onChange(o.id)}
            name={name}
          >
            {o.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
