@思考法の使い方.md をマルチエージェンティブに挙動するMCPツールを実装します。
@https://github.com/modelcontextprotocol/typescript-sdk 

使用言語は、TypeScriptです。 また実行は、 @https://github.com/dahlia/optique と、@https://github.com/privatenumber/tsx で行います。
定義はZodスキーマファーストで実装してください。 @Zod 
各思考の分析はLLMで動的に行われます。
LLMの呼び出しは、@https://github.com/vercel/ai  を使います。
Agentの実装は、 @https://www.anthropic.com/engineering/building-effective-agents を大いに参考にしてみてください。
LLMからのレスポンスがスキーマとマッチしなかった場合等のエラー処理も実装してください。
自動復旧させてください。

このMCPツールは、将来的にはnpmレジストリから利用できるようにしたいです。

このMCPツールは、Cursorやclaude codeで利用します。

このプロジェクトは、「CONFLUX」という名前で、GitHub(https://github.com/53able/conflux)に公開します。

パッケージ管理は、 pnpm を使います。
https://github.com/pnpm/pnpm

@How to use thinking methods 
