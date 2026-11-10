// A random 6-digit design number, re-rolled if it is already taken ("Design #219868").
export async function newDesignNumber(db) {
  for (let i = 0; i < 8; i++) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const { data: clash } = await db.from('saved_designs').select('id').eq('name', `Design #${candidate}`).limit(1);
    if (!clash || clash.length === 0) return candidate;
  }
  return '';
}
