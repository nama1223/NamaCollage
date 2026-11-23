/* NamaCollage 用チュートリアル設定（NamaTutorial キット v1）
   キャラの口調: 基本は丁寧語。文末は「です」「ます」の代わりに「ナマ」を語幹へ直接付ける（規格参照） */
window.NAMA_TUTORIAL_CONFIG = {
  appId: 'namacollage',
  assetBase: 'tutorial/img/',
  buttonImage: 'tutorial/img/tutorial-button.png',
  bridge: 'NamaCollageTutorialBridge',
  introTitle: 'NamaCollageの使い方',
  introText: '画像を集めて並べ、文字や図形を重ねて、1枚の画像に仕上げる流れを、実際の画面を触りながら案内しナマ。',
  chapters: [
    {
      id: 'intro', page: 'images', title: 'はじめに', desc: '画面の構成と、この案内の使い方', icon: 'wave', since: 1,
      steps: [
        { pose: 'wave', text: 'やあやあ！我こそは生物[ナマモノ] ナマ。NamaCollageの案内役を仰せつかってナマ。この案内はいつでも✕ボタンでやめられるし、やめた後も{{btnPos}}のボタンから見直せナマ。気楽にどうぞナマ。' },
        { target: '#nav', pose: 'point', text: '画面の下には4つのタブが並びナマ。「画像」「プレビュー」「トッピング」「保存」ナマ。押して切り替えナマ。' },
        { pose: 'thinking', text: '使い方はシンプルな流れナマ。まず「画像」で材料を集めて並べ、次に「プレビュー」で1枚に合成し、「トッピング」で文字や図形を重ねて、最後に「保存」で書き出しナマ。' },
        { target: '#nt-btn', pose: 'thumbs_up', text: 'この案内は、{{btnPos}}のこのボタンからいつでも開き直せナマ。新しい章が増えると赤い印が付きナマ。ボタンはドラッグで好きな場所へ動かせナマ。' }
      ]
    },
    {
      id: 'images', page: 'images', title: '画像', desc: '材料を集める・並べる・加工する', icon: 'yay', since: 1,
      steps: [
        { page: 'images', pose: 'wave', text: '「画像」の章ナマ。材料の画像を集めて、並びを決める画面ナマ。' },
        { page: 'images', target: '#btn-add-first', pose: 'point', text: '画像がまだ無い時は、このボタンから選んで追加できナマ。パソコンなら、画像ファイルを画面へ放り込むドラッグ＆ドロップでも追加できナマ。' },
        { page: 'images', target: '#btn-add-more', pose: 'point', text: '追加はここからナマ。何枚でも足せナマ。' },
        { page: 'images', target: '#grid-view', pose: 'point', text: '集めた画像は、行と列の表で並びナマ。各画像の矢印ボタンで上下左右へ動かせて、並びの「＋」を押すと、その場所へ画像を差し込めナマ。行の境目の「＋ 行を追加」では、新しい行から始められナマ。' },
        { page: 'images', target: '#grid-view', pose: 'point', text: '画像を長押しした時のメニューからは、「下の行と結合（縦またぎ）」も選べナマ。縦に並んだ画像の隣へ、最大で3行分をまたぐ縦長の配置が作れナマ。やめる時は、同じメニューの「縦またぎを解除」ナマ。' },
        { page: 'images', target: '.gv-cell', pose: 'point', text: '画像を押すと原寸で大きく見られて、長押し（右クリック）すると加工メニューが出ナマ。トリミング、中抜き、回転、反転、カラー調整、それと「画像の変更」と「編集をリセット」が使えナマ。' },
        { page: 'images', target: '#btn-clear', pose: 'point', text: '「全削除」は、集めた画像を全部消すボタンナマ。押すと確認が出ナマ。その中に「トッピングも全削除する」のチェックがありナマ。最初は外れていて、付けるとトッピングも一緒に消えナマ。' },
        { page: 'images', target: '#btn-load-namaco', pose: 'point', text: '下のボタンからは、「保存」の章で案内する「.namaco」形式のファイルを読み戻せナマ。保存しておいた編集の続きから始められナマ。読み込むと今の内容は破棄されるので、確認が出ナマ。' }
      ]
    },
    {
      id: 'preview', page: 'preview', title: 'プレビュー', desc: '1枚に合成して、並び方と背景を整える', icon: 'sparkle', since: 1,
      steps: [
        { page: 'preview', pose: 'wave', text: '「プレビュー」の章ナマ。集めた画像を1枚に合成して、並び方や背景を整える画面ナマ。画像が入っていないと中身が出ないので、その時は「画像」の章を先にどうぞナマ。' },
        { page: 'preview', target: '#btn-compose', mode: 'tap', pose: 'point', text: '合成はこのボタンからナマ。押してみるナマ。下の設定を変えた時は、少し待つと自動で合成し直されナマ。' },
        { page: 'preview', target: '#preview-canvas', pose: 'point', text: 'できあがりはここに表示されナマ。押すと拡大して見られナマ。上の小さな表示は、仕上がりの大きさと容量の目安ナマ。' },
        { page: 'preview', target: '#adj-panel', pose: 'point', text: '並び方の調整は、このパネルに集まってナマ。「統一」は、画像の大きさを横幅・高さ・長辺・短辺のどれで揃えるか。「基準」は、その大きさを一番大きい画像・小さい画像・先頭の画像・指定ピクセルのどれに合わせるかナマ。' },
        { page: 'preview', target: ['#adj-last-row', '#adj-alignment'], pose: 'point', text: '「最終行」は、最後の行が余った時の扱いナマ。均等配置、最後を拡大、空白のまま、から選べナマ。「配置」は、行の中での寄せ方ナマ。' },
        { page: 'preview', target: '#adj-gap', mode: 'free', pose: 'point', text: '「間隔」は、画像と画像の間の広さナマ。試しに動かしてみるナマ。' },
        { page: 'preview', target: '#adj-padding', mode: 'free', pose: 'point', text: '「余白」は、外周の広さナマ。こちらも試しにどうぞナマ。' },
        { page: 'preview', target: ['#adj-bg-color', '#adj-bg-transparent'], pose: 'point', text: '「背景色」は、間隔や余白の部分に出る色ナマ。「透明」にチェックを入れると、背景の透けた画像で書き出せナマ。' },
        { page: 'preview', target: ['#s-outer-border', '#s-inner-border'], pose: 'point', text: '「外枠」は全体の縁、「セル枠」は画像ごとの縁ナマ。それぞれ太さと色を決められナマ。' },
        { page: 'preview', target: ['#btn-pick-canvas', '#btn-eyedrop'], pose: 'point', text: '背景色は、合成した画像の中から拾うこともできナマ。「スクリーンスポイト」は画面上の色を拾う機能で、対応したブラウザでだけ使えナマ。' }
      ]
    },
    {
      id: 'topping', page: 'topping', title: 'トッピング', desc: '文字・図形・フィルタを重ねる', icon: 'thinking', since: 1,
      steps: [
        { page: 'topping', pose: 'wave', text: '「トッピング」の章ナマ。合成した画像の上に、文字や図形などを重ねる画面ナマ。先に「プレビュー」で合成していないと中身が出ないので、その時は順番にどうぞナマ。' },
        { page: 'topping', target: '#topping-canvas', pose: 'point', text: '重ねたものは、この画面に表示されナマ。押して選ぶと下に設定欄が出て、ものによっては直接ドラッグで場所や大きさを変えられナマ。' },
        { page: 'topping', target: ['.tp-add-btn[data-tp="text"]', '.tp-add-btn[data-tp="image"]'], pose: 'point', text: '足せるものは、まず「テキスト」と「画像」ナマ。テキストは文字入れ、画像は別の画像を重ねる時に使いナマ。' },
        { page: 'topping', target: ['#tp-sel-line', '#tp-sel-shape', '#tp-sel-filter'], pose: 'point', text: '横のメニューからは、直線・矢印・集中線などの線、四角や楕円や多角形の図形、それと「ぼかし」と「モザイク」のフィルタも選べナマ。目隠しに便利ナマ。' },
        { page: 'topping', target: '#tp-selected-panel', pose: 'point', text: '選んだトッピングの設定は、ここに出ナマ。文字の内容やフォント、色、大きさ、位置、回転などを細かく決められナマ。' },
        { page: 'topping', target: '#topping-list', pose: 'point', text: '重ねたものの一覧はここナマ。左端の⠿をドラッグすると重なる順番が変わって、👁で表示と非表示、⧉で複製、✕で削除ナマ。' },
        { page: 'topping', target: ['#tp-undo', '#tp-redo'], pose: 'point', text: '操作は「元に戻す」で戻せて、「やり直し」もできナマ。間違えても慌てなくて大丈夫ナマ。' },
        { page: 'topping', target: '#tp-storage-btn', pose: 'point', text: '「💾 保管」は、トッピングだけの保管場所ナマ。ファイル（.namatop）への保存と読み込みのほか、名前を付けてアプリの中に保管しておくこともできナマ。読み込む時は、現在のトッピングへの上書き確認と、内容のプレビューが出ナマ。' },
        { page: 'topping', target: '#tp-clear-all-btn', pose: 'point', text: '一番下には「トッピングを全て消去」もありナマ。確認が出て、消した後でも「元に戻す」で復活できナマ。' }
      ]
    },
    {
      id: 'save', page: 'save', title: '保存', desc: '編集データの保存と、完成品の書き出し', icon: 'thumbs_up', since: 1,
      steps: [
        { page: 'save', pose: 'wave', text: '「保存」の章ナマ。保存には3種類あって、編集全部の保存と、トッピングだけの保存と、完成品の書き出しナマ。' },
        { page: 'save', target: '#btn-save-namaco', pose: 'point', text: '「.namaco形式で保存」は、画像も編集内容も全部入った独自形式ナマ。後から「画像」タブで読み戻すと、続きを編集できナマ。' },
        { page: 'save', target: '#btn-save-namatop', pose: 'point', text: '「🏷️ .namatop形式で保存」は、トッピングだけを保存するボタンナマ。別の画像に同じトッピングを載せたい時に、「トッピング」タブの「💾 保管」から読み戻せナマ。' },
        { page: 'save', target: '.format-pills', mode: 'free', pose: 'point', text: '完成品の形式は、JPEG・PNG・WebPから選べナマ。押して切り替えられナマ。' },
        { page: 'save', target: '#save-quality', mode: 'free', pose: 'point', text: '「品質」は、JPEGとWebPの圧縮の強さナマ。数字が大きいほど綺麗で、ファイルも大きくなりナマ。試しに動かしてみるナマ。' },
        { page: 'save', target: '#s-max-pixels', pose: 'point', text: '「最大ピクセル数」は、仕上がりの大きさの上限ナマ。超えた場合は、自動で縮小して保存されナマ。' },
        { page: 'save', target: '#btn-pick-savedir', pose: 'point', text: '対応したブラウザでは、保存先のフォルダを決められナマ。決めていない時は、普通のダウンロードと同じ場所に保存されナマ。' },
        { page: 'save', target: '#btn-download', pose: 'point', text: '最後は、この「ダウンロード」ボタンで書き出しナマ。プレビューにトッピングを重ねた、今の状態がそのまま出ていきナマ。実際に押すと本当に保存されるので、この案内では押さなくて大丈夫ナマ。' }
      ]
    }
  ],
  en: {
    introTitle: 'How to Use NamaCollage',
    introText: "Let's walk through collecting images, lining them up, overlaying text and shapes, and finishing one combined image — touching the real screen as we go, nama.",
    chapters: [
      {
        id: 'intro', page: 'images', title: 'First Steps', desc: 'The layout, and how this guide works', icon: 'wave', since: 1,
        steps: [
          { pose: 'wave', text: 'Well met! I am Nama, the creature [Namamono], nama. I will be your guide for NamaCollage, nama. You can quit this guide anytime with the ✕ button, and after quitting you can reopen it from the button at the {{btnPos}}, nama. Take it easy, nama.' },
          { target: '#nav', pose: 'point', text: 'Four tabs line the bottom of the screen, nama: Images, Preview, Toppings, and Save. Tap to switch, nama.' },
          { pose: 'thinking', text: 'The flow is simple, nama. First you collect and arrange your material in Images, then join it into one image in Preview, overlay text and shapes in Toppings, and export it in Save, nama.' },
          { target: '#nt-btn', pose: 'thumbs_up', text: 'You can reopen this guide anytime from this button at the {{btnPos}}, nama. When new chapters are added, it gets a red badge, nama. You can also drag the button wherever you like, nama.' }
        ]
      },
      {
        id: 'images', page: 'images', title: 'Images', desc: 'Collect, arrange and edit your images', icon: 'yay', since: 1,
        steps: [
          { page: 'images', pose: 'wave', text: 'The Images chapter, nama. This is where you collect your image material and decide the arrangement, nama.' },
          { page: 'images', target: '#btn-add-first', pose: 'point', text: 'When you have no images yet, choose and add them from this button, nama. On a computer, you can also drag & drop image files onto the screen, nama.' },
          { page: 'images', target: '#btn-add-more', pose: 'point', text: 'Add more from here, nama. As many as you like, nama.' },
          { page: 'images', target: '#grid-view', pose: 'point', text: 'Your images line up in a grid of rows and columns, nama. Move each image with the arrow buttons on it, and press a + between images to insert one at that spot, nama. The + Add row at a row boundary starts a new row, nama.' },
          { page: 'images', target: '#grid-view', pose: 'point', text: 'From the long-press menu of an image, you can also choose "Join row below (span)", nama. It makes a tall placement spanning up to 3 rows, beside the images stacked below, nama. To undo it, choose "Release span" from the same menu, nama.' },
          { page: 'images', target: '.gv-cell', pose: 'point', text: 'Tap an image to see it big at full size, and long-press (or right-click) for the edit menu, nama. Trim, Cut out, Rotate, Flip, Color adjust, Replace image, and Reset edits are all there, nama.' },
          { page: 'images', target: '#btn-clear', pose: 'point', text: '"Clear all" deletes every image you collected, nama. A confirmation appears, nama. It has an "Also delete all toppings" checkbox, nama. It starts unchecked; check it to delete the toppings together, nama.' },
          { page: 'images', target: '#btn-load-namaco', pose: 'point', text: 'From the button below, you can load back a .namaco file — the format covered in the Save chapter, nama. You can pick up editing where you left off, nama. Loading discards your current work, so a confirmation appears, nama.' }
        ]
      },
      {
        id: 'preview', page: 'preview', title: 'Preview', desc: 'Join into one image; tune the layout and background', icon: 'sparkle', since: 1,
        steps: [
          { page: 'preview', pose: 'wave', text: 'The Preview chapter, nama. This is where you join your images into one and tune the layout and background, nama. If you have no images yet, nothing shows here — see the Images chapter first, nama.' },
          { page: 'preview', target: '#btn-compose', mode: 'tap', pose: 'point', text: "Joining starts from this button, nama. Let's tap it, nama. After you change the settings below, it re-joins automatically after a short wait, nama." },
          { page: 'preview', target: '#preview-canvas', pose: 'point', text: 'The result shows here, nama. Tap it to see it bigger, nama. The small display above shows the finished size and a rough file size, nama.' },
          { page: 'preview', target: '#adj-panel', pose: 'point', text: '"Match" picks what to align the image sizes by — Width, Height, Long, or Short, nama. "Base" picks what to match them to — the Max image, the Min image, the First image, or Custom px, nama.' },
          { page: 'preview', target: ['#adj-last-row', '#adj-alignment'], pose: 'point', text: '"Last row" is what happens when the last row has leftovers, nama. Choose from Distribute, Stretch last, or Leave empty, nama. "Align" is how the images sit within a row, nama.' },
          { page: 'preview', target: '#adj-gap', mode: 'free', pose: 'point', text: '"Gap" is the space between images, nama. Try moving it, nama.' },
          { page: 'preview', target: '#adj-padding', mode: 'free', pose: 'point', text: '"Pad" is the space around the outside, nama. Try this one too, nama.' },
          { page: 'preview', target: ['#adj-bg-color', '#adj-bg-transparent'], pose: 'point', text: '"BG" is the color that shows in the gaps and padding, nama. Check "Clear" and the export gets a transparent background, nama.' },
          { page: 'preview', target: ['#s-outer-border', '#s-inner-border'], pose: 'point', text: '"Outer" is the frame around the whole image, and "Cell" is the frame around each image, nama. Each takes a thickness and a color, nama.' },
          { page: 'preview', target: ['#btn-pick-canvas', '#btn-eyedrop'], pose: 'point', text: 'You can also pick the background color from the joined image itself with "Pick BG from image", nama. The "Eyedropper" picks a color from anywhere on screen, and only works in browsers that support it, nama.' }
        ]
      },
      {
        id: 'topping', page: 'topping', title: 'Toppings', desc: 'Overlay text, shapes and filters', icon: 'thinking', since: 1,
        steps: [
          { page: 'topping', pose: 'wave', text: "The Toppings chapter, nama. This is where you overlay text and shapes on the joined image, nama. If you haven't joined an image in Preview yet, nothing shows here — go in order, nama." },
          { page: 'topping', target: '#topping-canvas', pose: 'point', text: 'What you overlay shows on this screen, nama. Tap to select one and its settings appear below; some can be dragged directly to move or resize, nama.' },
          { page: 'topping', target: ['.tp-add-btn[data-tp="text"]', '.tp-add-btn[data-tp="image"]'], pose: 'point', text: 'First, what you can add: "Text" and "Image", nama. Text is for lettering; Image overlays another picture, nama.' },
          { page: 'topping', target: ['#tp-sel-line', '#tp-sel-shape', '#tp-sel-filter'], pose: 'point', text: 'The menus beside them offer lines — straight lines, arrows, burst lines — shapes like rectangles, ellipses and polygons, and the Blur and Mosaic filters, nama. Handy for hiding things, nama.' },
          { page: 'topping', target: '#tp-selected-panel', pose: 'point', text: "The selected topping's settings appear here, nama. Text content, font, color, size, position, rotation — you can tune them in detail, nama." },
          { page: 'topping', target: '#topping-list', pose: 'point', text: "The list of what you've overlaid is here, nama. Drag the ⠿ at the left edge to change the stacking order; the eye toggles show and hide, the double-square duplicates, and ✕ deletes, nama." },
          { page: 'topping', target: ['#tp-undo', '#tp-redo'], pose: 'point', text: '"Undo" takes an action back, and "Redo" is there too, nama. No need to panic over a mistake, nama.' },
          { page: 'topping', target: '#tp-storage-btn', pose: 'point', text: '"💾 Store" is a storage place for toppings only, nama. Besides saving to and loading from a file (.namatop), you can store named sets inside the app, nama. When loading, you get an overwrite confirmation and a preview of the contents, nama.' },
          { page: 'topping', target: '#tp-clear-all-btn', pose: 'point', text: 'At the very bottom there is also "Delete all toppings", nama. A confirmation appears, and even after deleting you can bring them back with Undo, nama.' }
        ]
      },
      {
        id: 'save', page: 'save', title: 'Save', desc: 'Save edit data and export the finished image', icon: 'thumbs_up', since: 1,
        steps: [
          { page: 'save', pose: 'wave', text: 'The Save chapter, nama. There are 3 kinds of saving: saving all your edits, saving just the toppings, and exporting the finished image, nama.' },
          { page: 'save', target: '#btn-save-namaco', pose: 'point', text: '"Save as .namaco" is our own format holding everything — the images and the edit data alike, nama. Load it back later from the Images tab to keep editing, nama.' },
          { page: 'save', target: '#btn-save-namatop', pose: 'point', text: '"Save as .namatop" saves only the toppings, nama. To put the same toppings on a different image, load it from "💾 Store" in the Toppings tab, nama.' },
          { page: 'save', target: '.format-pills', mode: 'free', pose: 'point', text: 'The finished format is JPEG, PNG, or WebP, nama. Tap to switch, nama.' },
          { page: 'save', target: '#save-quality', mode: 'free', pose: 'point', text: '"Quality" is the compression strength for JPEG and WebP, nama. Bigger numbers look better and make bigger files, nama. Try moving it, nama.' },
          { page: 'save', target: '#s-max-pixels', pose: 'point', text: '"Max pixels (cap)" is the upper limit of the finished size, nama. If the image exceeds it, it is shrunk automatically when saved, nama.' },
          { page: 'save', target: '#btn-pick-savedir', pose: 'point', text: "In browsers that support it, you can choose the save folder, nama. If you don't choose one, the file lands in the usual download place, nama." },
          { page: 'save', target: '#btn-download', pose: 'point', text: 'Finally, export with this "Download" button, nama. The preview with its toppings, exactly as it stands, goes out, nama. Pressing it really saves the file, so in this guide you do not need to press it, nama.' }
        ]
      }
    ]
  }
};
