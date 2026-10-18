// 번호 공 한 줄. shown 개수만큼만 보이고, 나머지는 빈 자리.
import { ballClass } from '../lib/luck.js';

export default function Balls({ numbers, shown = numbers.length, label, small = false }) {
  return (
    <ol className={`balls${small ? ' small' : ''}`} aria-label={label}>
      {numbers.map((n, i) => (
        <li key={i} className={i < shown ? `ball ${ballClass(n)} pop` : 'ball empty'} aria-hidden={i < shown ? undefined : true}>
          {i < shown ? n : ''}
        </li>
      ))}
    </ol>
  );
}
