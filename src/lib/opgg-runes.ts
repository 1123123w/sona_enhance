import { lcu } from '@/lib/lcu'
import type { OpggRuneBuild } from '@/lib/opgg-api'

export async function applyOpggRunePage(rune: OpggRuneBuild, championName: string) {
  return lcu.applyRunePage({
    name: championName,
    primaryStyleId: rune.primary_page_id,
    subStyleId: rune.secondary_page_id,
    selectedPerkIds: [
      ...rune.primary_rune_ids,
      ...rune.secondary_rune_ids,
      ...rune.stat_mod_ids,
    ],
  })
}
