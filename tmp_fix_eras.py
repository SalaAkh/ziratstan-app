import re

with open('profiles_data.js', 'r', encoding='utf-8') as f:
    data = f.read()

# Era mapping based on ID, name/birth year
# khanate: 15th century - 1847
# alash: 1830 - 1940 (enlighteners, Alash Orda members, writers)
# soviet: 1880+ (Soviet era and modern)

# Profiles that should be 'khanate' (XV-XIX century rulers, biys, batyrs)
khanate_ids = {
    'beket_ata_2', 'abylai_khan_4', 'tauke_khan_5', 'kasym_khan_6', 
    'zhanibek_khan_7', 'tole_bi_8', 'kazybek_bi_9', 'aiteke_bi_10',
    'raiymbek_batyr_11', 'qabanbay_batyr_12', 'bogenbay_batyr_13',
    'sirim_datuly_14', 'makhambet_15', 'isatay_16',
    'kurmangazy_32', 'dauletkerei_33', 'tattimbet_34', 'akan_seri_36',
    'birzhan_sal_37', 'dina_35',
}

# Medieval profiles (IX-XV century)
medieval_ids = {'korkyt_ata_3'}

# Alash Orda / Enlighteners
alash_ids = {
    'abai_18', 'shakarim_19', 'chokan_20', 'altynsarin_21', 'zhambyl_22',
    'akhmet_b_23', 'mirzhakyp_24', 'magzhan_25', 'saken_s_26', 
    'beimbet_27', 'iliyas_zh_28', 'zhusupbek_29', 'sultanmahmut_30',
    'mashhur_31', 'bokeykhan_39', 'mustafa_40', 'turar_41', 'oraz_42',
    'khalel_43', 'sanzhar_44', 'amangeldi_17',
}

# Soviet era and modern
soviet_ids = {
    'kunayev_38', 'bauyrzhan_48', 'aliya_49', 'manshuk_50', 'talgat_51',
    'sagadat_52', 'rakhymzhan_53', 'kasym_54', 'hiuaz_55', 'nurken_56',
    'kanysh_57', 'ermukhan_58', 'alkei_59', 'evney_60', 'salyk_61',
    'auezov_62', 'gabit_63', 'sabit_64', 'iliyas_e_65', 'mukagali_66',
    'tumanbay_67', 'fariza_68', 'abish_69', 'sherkhan_70', 'abdizhamil_71',
    'qadyr_72', 'gerold_73', 'shamshi_74', 'nurgisa_75', 'ermek_76',
    'shaken_77', 'roza_b_78', 'batyrkhan_79', 'denis_ten_80',
    'kulyash_81', 'shara_82', 'mukan_83', 'gaziza_84', 'ahmet_zh_85',
    'zhumabay_45', 'zhumabek_46', 'ozbekali_47',
}

def get_era_for_id(profile_id):
    if profile_id in khanate_ids:
        return 'khanate'
    elif profile_id in medieval_ids:
        return 'medieval'
    elif profile_id in alash_ids:
        return 'alash'
    elif profile_id in soviet_ids:
        return 'soviet'
    return None

# Process multi-line profiles (format: "{\n        id: '...', name: '...', fullName: '...',\n        birth: ...")
def add_era_to_multiline(match):
    full_match = match.group(0)
    profile_id = match.group(1)
    
    # Skip if already has era
    if 'era:' in full_match:
        return full_match
    
    era = get_era_for_id(profile_id)
    
    if era is None:
        # Try to determine by birth year from the match content
        birth_match = re.search(r"birth: '(\d+)'", full_match)
        if birth_match:
            birth_year = int(birth_match.group(1))
            if birth_year < 1400:
                era = 'medieval'
            elif birth_year <= 1800:
                era = 'khanate'
            elif birth_year <= 1880:
                era = 'alash'
            else:
                era = 'soviet'
        else:
            era = 'soviet'  # Default for unknown
    
    # Insert era after fullName
    # Pattern: "fullName: 'X',\n        birth:"
    result = re.sub(
        r"(fullName: '[^']*'),\s*\n(\s+birth:)",
        f"\\1, era: '{era}',\n\\2",
        full_match,
        count=1
    )
    return result

pattern = re.compile(r'\{\s*\n\s+id: \'([^\']+)\',.*?(?=\n\s+\})', re.DOTALL)
data = pattern.sub(add_era_to_multiline, data)

total = len(re.findall(r"id: '", data))
with_era = len(re.findall(r"era: '", data))
print(f"Total: {total}, with era: {with_era}, still missing: {total - with_era}")

with open('profiles_data.js', 'w', encoding='utf-8') as f:
    f.write(data)
print("Done!")
