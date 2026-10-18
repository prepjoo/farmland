export default function Placeholder({ title, week }) {
  return (
    <section className="placeholder">
      <h1>{title}</h1>
      {week && <p>{week}에 만들 화면입니다.</p>}
      <a href="#/">처음으로</a>
    </section>
  );
}
