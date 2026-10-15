"""Test variantlarini talabaga aralashtirib ko'rsatish (sof funksiya, bazaga bog'liq emas).

Tartib (talaba, savol) juftligidan deterministik hosil qilinadi: sahifa qayta ochilganda ham,
javob baholanganda ham bir xil chiqadi, shuning uchun uni saqlash shart emas. Bazada variantlar
o'qituvchi kiritgan tartibda qoladi.
"""

import random


def option_order(user_id: int, question_id: int, count: int) -> list[int]:
    """`order[i]` — talabaga `i`-o'rinda ko'rsatiladigan variantning asl indeksi."""
    order = list(range(count))
    random.Random(f"{user_id}:{question_id}").shuffle(order)
    return order
