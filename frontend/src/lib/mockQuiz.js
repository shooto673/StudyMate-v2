// Mock quiz data for demo - will be replaced by Claude API generation
export function generateMockQuiz(subUnit) {
  const quizSets = {
    // 英語: アルファベット - 大文字・小文字
    'j1-alphabet-1': [
      { id: 1, type: '4choice', question: '「A」の小文字はどれ？', choices: ['a', 'e', 'd', 'o'], answer: 0, explanation: '「A」の小文字は「a」です。大文字と形が似ているので覚えやすいですね！' },
      { id: 2, type: '4choice', question: '「G」の小文字はどれ？', choices: ['q', 'g', 'p', 'j'], answer: 1, explanation: '「G」の小文字は「g」です。「q」と間違えやすいので注意！' },
      { id: 3, type: '4choice', question: '次のうち、大文字と小文字の形が大きく違うのは？', choices: ['C / c', 'S / s', 'A / a', 'O / o'], answer: 2, explanation: '「A」と「a」は大文字と小文字で形がかなり違います。' },
      { id: 4, type: '4choice', question: '「b」の大文字はどれ？', choices: ['D', 'B', 'P', 'R'], answer: 1, explanation: '「b」の大文字は「B」です。「d」と混同しないように注意！' },
      { id: 5, type: '4choice', question: '「M」の小文字はどれ？', choices: ['n', 'w', 'm', 'u'], answer: 2, explanation: '「M」の小文字は「m」。山が3つから2つになります。' },
      { id: 6, type: '4choice', question: '次のうち、大文字と小文字が同じ形の文字は？', choices: ['A / a', 'B / b', 'C / c', 'D / d'], answer: 2, explanation: '「C」と「c」は大きさが違うだけで同じ形です。' },
      { id: 7, type: '4choice', question: '「R」の小文字はどれ？', choices: ['r', 'n', 'v', 'l'], answer: 0, explanation: '「R」の小文字は「r」です。' },
      { id: 8, type: '4choice', question: '「q」の大文字はどれ？', choices: ['O', 'G', 'Q', 'P'], answer: 2, explanation: '「q」の大文字は「Q」です。しっぽが特徴的ですね。' },
      { id: 9, type: '4choice', question: 'アルファベットは全部で何文字？', choices: ['24文字', '25文字', '26文字', '28文字'], answer: 2, explanation: 'アルファベットは A〜Z の全26文字です。' },
      { id: 10, type: '4choice', question: '「H」の小文字はどれ？', choices: ['n', 'h', 'b', 'k'], answer: 1, explanation: '「H」の小文字は「h」。縦棒の右側にふくらみがあります。' },
    ],
    // 英語: be動詞 - am, is, are
    'j1-be-verbs-1': [
      { id: 1, type: '4choice', question: '「I ___ a student.」___に入るのは？', choices: ['is', 'am', 'are', 'be'], answer: 1, explanation: '主語が「I」のときは「am」を使います。' },
      { id: 2, type: '4choice', question: '「She ___ happy.」___に入るのは？', choices: ['am', 'are', 'is', 'be'], answer: 2, explanation: '主語が「She（彼女）」のときは「is」を使います。' },
      { id: 3, type: '4choice', question: '「They ___ teachers.」___に入るのは？', choices: ['is', 'am', 'are', 'was'], answer: 2, explanation: '主語が「They（彼ら）」は複数なので「are」を使います。' },
      { id: 4, type: '4choice', question: '「He ___ from Japan.」___に入るのは？', choices: ['are', 'am', 'is', 'do'], answer: 2, explanation: '主語が「He（彼）」のときは「is」を使います。' },
      { id: 5, type: '4choice', question: '「You ___ my friend.」___に入るのは？', choices: ['am', 'is', 'are', 'be'], answer: 2, explanation: '主語が「You」のときは「are」を使います。' },
      { id: 6, type: '4choice', question: '「We ___ in Tokyo.」___に入るのは？', choices: ['is', 'am', 'are', 'be'], answer: 2, explanation: '主語が「We（私たち）」は複数なので「are」を使います。' },
      { id: 7, type: '4choice', question: '「It ___ a cat.」___に入るのは？', choices: ['are', 'am', 'is', 'do'], answer: 2, explanation: '主語が「It（それ）」のときは「is」を使います。' },
      { id: 8, type: '4choice', question: '「I am」の短縮形はどれ？', choices: ["I'am", "Im", "I'm", "Ia'm"], answer: 2, explanation: '「I am」の短縮形は「I\'m」です。アポストロフィの位置に注意！' },
      { id: 9, type: '4choice', question: '「My mother ___ kind.」___に入るのは？', choices: ['am', 'are', 'is', 'be'], answer: 2, explanation: '「My mother（私の母）」は三人称単数なので「is」を使います。' },
      { id: 10, type: '4choice', question: '「Ken and Yuki ___ friends.」___に入るのは？', choices: ['is', 'am', 'are', 'be'], answer: 2, explanation: '「Ken and Yuki」は2人（複数）なので「are」を使います。' },
    ],
  }

  // Default fallback quiz for any sub-unit
  const defaultQuiz = [
    { id: 1, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 1`, choices: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'これはデモ問題です。実際にはAI が生成した問題が表示されます。' },
    { id: 2, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 2`, choices: ['A', 'B', 'C', 'D'], answer: 1, explanation: 'これはデモ問題です。' },
    { id: 3, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 3`, choices: ['A', 'B', 'C', 'D'], answer: 2, explanation: 'これはデモ問題です。' },
    { id: 4, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 4`, choices: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'これはデモ問題です。' },
    { id: 5, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 5`, choices: ['A', 'B', 'C', 'D'], answer: 3, explanation: 'これはデモ問題です。' },
    { id: 6, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 6`, choices: ['A', 'B', 'C', 'D'], answer: 1, explanation: 'これはデモ問題です。' },
    { id: 7, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 7`, choices: ['A', 'B', 'C', 'D'], answer: 2, explanation: 'これはデモ問題です。' },
    { id: 8, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 8`, choices: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'これはデモ問題です。' },
    { id: 9, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 9`, choices: ['A', 'B', 'C', 'D'], answer: 1, explanation: 'これはデモ問題です。' },
    { id: 10, type: '4choice', question: `${subUnit?.title || 'テスト'}の問題 10`, choices: ['A', 'B', 'C', 'D'], answer: 3, explanation: 'これはデモ問題です。' },
  ]

  return quizSets[subUnit?.slug] || defaultQuiz
}
