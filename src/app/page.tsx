import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
  
  // redirect()は例外をスローするため、このコンポーネントは何もレンダリングしません。
  // nullを返しても良いですが、通常はここまで到達しません。
  return null;
}
