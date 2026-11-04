// The course map: parts in order. Each lesson's frontmatter `part` points at one of these ids.
export interface Part {
  id: number;
  title: string; // Bangla
  subtitle: string;
  icon: string;
  color: string; // accent for the board
}

export const parts: Part[] = [
  { id: 1, title: 'শুরু', subtitle: 'Rust বসানো, প্রথম প্রোগ্রাম, variable, type, function, loop', icon: '🚀', color: '#ff7a2f' },
  { id: 2, title: 'Ownership', subtitle: 'Rust-এর হৃদয়: move, borrow, slice', icon: '🧠', color: '#f2b134' },
  { id: 3, title: 'ডেটা সাজানো', subtitle: 'struct, enum, Option, Vec, String, HashMap', icon: '🧱', color: '#4cc38a' },
  { id: 4, title: 'Error আর Module', subtitle: 'Result, ? অপারেটর, module, Cargo, crate', icon: '🛡️', color: '#3fb8e0' },
  { id: 5, title: 'Generic আর Trait', subtitle: 'generic, trait, derive, lifetime, dyn Trait', icon: '🧩', color: '#8b7cf6' },
  { id: 6, title: 'Functional Rust', subtitle: 'closure আর iterator', icon: 'λ', color: '#e05fa0' },
  { id: 7, title: 'Smart Pointer', subtitle: 'Box, Drop, Rc, RefCell, Weak', icon: '📦', color: '#ff7a2f' },
  { id: 8, title: 'Advanced Rust', subtitle: 'pattern, macro, test, unsafe', icon: '⚙️', color: '#f2b134' },
  { id: 9, title: 'Fearless Concurrency', subtitle: 'thread, channel, Mutex, Arc, async', icon: '⚡', color: '#4cc38a' },
  { id: 10, title: 'প্রজেক্ট', subtitle: 'CLI টুল, multi-thread প্রজেক্ট, ইকোসিস্টেম', icon: '🏆', color: '#3fb8e0' },
];

export const site = {
  name: 'Rust বাংলা',
  tagline: 'শূন্য থেকে Advanced Rust, বাংলায়, খেলতে খেলতে',
  youtube: 'https://www.youtube.com/@RustBangla',
  playlist: 'https://www.youtube.com/playlist?list=PLdTXxcF8D3uk',
  facebook: 'https://www.facebook.com/profile.php?id=61595529051615',
};
