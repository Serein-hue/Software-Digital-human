import fs from 'node:fs/promises'
import path from 'node:path'

const frontendRoot = process.cwd()
const sourceRoot = path.resolve(frontendRoot, '..')
const targetRoot = path.join(frontendRoot, 'src', 'content')

const files = [
  'prd-a5-ai-digital-human.md',
  'docs/index.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/summary.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/1-trend_research.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/2-user_research.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/3-competitor_analysis.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/4-tech_feasibility.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/5-research_report.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/6-prd_interaction.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/7-prd_content_engine.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/8-prd_digital_human.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/9-prd_analytics.md',
  'ao-output/景区导览AI数字人产品调研与PRD工作流-2026-05-18T15-51-00/steps/10-final_delivery.md',
]

await fs.mkdir(targetRoot, { recursive: true })

for (const file of files) {
  const source = path.join(sourceRoot, file)
  const target = path.join(targetRoot, file.replaceAll(/[\\/]/g, '__'))
  const content = await fs.readFile(source, 'utf8')
  await fs.writeFile(target, content)
}

console.log(`synced ${files.length} markdown files`)
