import React from 'react';
import { Heart, MessageCircle, Plus, Minus, AlertTriangle, Clock } from 'lucide-react';

const NextSteps: React.FC = () => {
  return (
    <div className="w-full space-y-6 px-2">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-jp-bold text-gray-900 text-center mb-8">
          次にやること
        </h1>
        
        <div className="space-y-6">
          {/* 翌日からかんじょうにっきをつける */}
          <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-jp-bold text-sm flex-shrink-0 mb-3">
                📝
              </div>
              <h3 className="font-jp-bold text-gray-900 mb-4 text-base sm:text-lg">翌日からかんじょうにっきをつける</h3>
            </div>
            <div>
                <p className="text-gray-700 font-jp-normal mb-6 leading-relaxed text-sm sm:text-base">
                  日記を書いたら、ネガティブな感情の種類を特定してください。感情の種類が特定出来ない時はお問い合わせからメッセージしてください。
                </p>
                
                {/* 8つのネガティブな感情 */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-blue-200">
                  <h4 className="font-jp-bold text-gray-900 mb-4 text-center text-sm sm:text-base">8つのネガティブな感情</h4>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">恐怖（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">悲しみ（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">怒り（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">寂しさ（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">無価値感（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">罪悪感（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">悔しさ（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">恥ずかしさ（ネガティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">嬉しい（ポジティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">感謝（ポジティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-lime-500 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">達成感（ポジティブ）</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-gray-700 font-jp-normal">幸せ（ポジティブ）</span>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* 無価値感を選んだ場合のみ */}
          <div className="bg-red-50 rounded-lg p-4 sm:p-6 border border-red-200">
            <div className="flex flex-col items-center text-center mb-6">
              <Heart className="w-8 h-8 text-red-500 flex-shrink-0 mb-3" />
              <h3 className="font-jp-bold text-gray-900 mb-4 text-base sm:text-lg">無価値感を選んだ場合のみ</h3>
            </div>
            <div>
                <p className="text-gray-700 font-jp-normal mb-6 leading-relaxed text-sm sm:text-base">
                  ネガティブな感情の種類の内、無価値感を選んだ場合は、メモしていたスコアからご自身で足し算または引き算してください。
                </p>
                
                {/* スコア調整方法 */}
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-red-200 mb-6">
                  <h4 className="font-jp-bold text-gray-900 mb-4 text-sm sm:text-base">スコア調整方法</h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2">
                      <Plus className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700 font-jp-normal">自己肯定感が上がったと感じた → 自己肯定感スコアを上げる → 無価値感スコアを下げる</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Minus className="w-4 h-4 text-red-600" />
                      <span className="text-gray-700 font-jp-normal">自己肯定感が下がったと感じた → 自己肯定感スコアを下げる → 無価値感スコアを上げる</span>
                    </div>
                  </div>
                </div>

                {/* 具体例 */}
                <div className="bg-green-50 rounded-lg p-4 sm:p-6 border border-green-200">
                  <h4 className="font-jp-bold text-gray-900 mb-4 text-sm sm:text-base">具体例</h4>
                  
                  <div className="mb-6">
                    <h5 className="font-jp-semibold text-gray-800 mb-3 text-xs sm:text-sm">5行日記の内容</h5>
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 text-xs sm:text-sm text-gray-700 font-jp-normal">
                      会社で上司に酷い人格否定をされた。傷ついた。泣いた。
                    </div>
                  </div>

                  <div>
                    <h5 className="font-jp-semibold text-gray-800 mb-3 text-xs sm:text-sm">スコア調整</h5>
                    <div className="space-y-3 text-xs sm:text-sm">
                      <div className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200">
                        <span className="text-gray-700 font-jp-normal">自己肯定感スコア</span>
                        <span className="text-blue-600 font-jp-medium">53から40へ</span>
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200">
                        <span className="text-gray-700 font-jp-normal">無価値感スコア</span>
                        <span className="text-red-600 font-jp-medium">47から60へ</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* 毎日続けることで見えてくること */}
          <div className="bg-purple-50 rounded-lg p-4 sm:p-6 border border-purple-200">
            <div className="flex flex-col items-center text-center mb-6">
              <Clock className="w-8 h-8 text-purple-500 flex-shrink-0 mb-3" />
              <h3 className="font-jp-bold text-gray-900 mb-4 text-base sm:text-lg">毎日続けることで見えてくること</h3>
            </div>
            <div>
                <p className="text-gray-700 font-jp-normal leading-relaxed text-sm sm:text-base">
                  無価値感を感じた出来事と向き合うことで、無価値感スコアの上下が自己肯定感の上下になっていることに気づくはずです。自己肯定感を育てるには無価値感を解放することです。
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextSteps;