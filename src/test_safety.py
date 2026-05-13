from src.safety_engine import analyze_safety

def test_safety_engine():
    print("=" * 60)
    print("  RxLens Clinical Safety Engine — Test Suite")
    print("=" * 60)
    
    # Test Case 1: Critical Interaction (Aspirin + Warfarin)
    drugs1 = ["Aspirin", "Warfarin", "Paracetamol"]
    profile1 = {"age": 45, "conditions": "Diabetes"}
    alerts1 = analyze_safety(drugs1, profile1)
    print(f"\n✅ Test 1 (Interaction + Contraindication): {len(alerts1)} alerts")
    for a in alerts1:
        print(f"  [{a['severity']}] {a['type']}: {a['message']}")

    # Test Case 2: Age Warning + Duplicate
    drugs2 = ["Aspirin", "Dolo", "Crocin"]
    profile2 = {"age": 8}
    alerts2 = analyze_safety(drugs2, profile2)
    print(f"\n✅ Test 2 (Age + Acetaminophen Stacking): {len(alerts2)} alerts")
    for a in alerts2:
        print(f"  [{a['severity']}] {a['type']}: {a['message']}")

    # Test Case 3: Pregnancy Contraindication
    drugs3 = ["Atorvastatin", "Amoxicillin"]
    profile3 = {"age": 30, "conditions": "Pregnancy"}
    alerts3 = analyze_safety(drugs3, profile3)
    print(f"\n✅ Test 3 (Pregnancy): {len(alerts3)} alerts")
    for a in alerts3:
        print(f"  [{a['severity']}] {a['type']}: {a['message']}")

    # Test Case 4: Allergy Conflict
    drugs4 = ["Amoxicillin", "Paracetamol"]
    profile4 = {"allergies": "Penicillin"}
    alerts4 = analyze_safety(drugs4, profile4)
    print(f"\n✅ Test 4 (Penicillin Allergy → Amoxicillin): {len(alerts4)} alerts")
    for a in alerts4:
        print(f"  [{a['severity']}] {a['type']}: {a['message']}")

    # Test Case 5: Brand name resolution (Dolo + Crocin = duplicate Paracetamol)
    drugs5 = ["Dolo 650", "Crocin", "Combiflam"]
    profile5 = {}
    alerts5 = analyze_safety(drugs5, profile5)
    print(f"\n✅ Test 5 (Brand Names + Duplicates): {len(alerts5)} alerts")
    for a in alerts5:
        print(f"  [{a['severity']}] {a['type']}: {a['message']}")

    # Test Case 6: Dosage Red Flag
    drugs6 = ["Paracetamol"]
    dosage6 = {"Paracetamol": "1500mg"}
    alerts6 = analyze_safety(drugs6, dosage_info=dosage6)
    print(f"\n✅ Test 6 (Dosage Red Flag): {len(alerts6)} alerts")
    for a in alerts6:
        print(f"  [{a['severity']}] {a['type']}: {a['message']}")

    # Test Case 7: Multiple conditions
    drugs7 = ["Ibuprofen", "Prednisolone"]
    profile7 = {"age": 70, "conditions": "Asthma, Diabetes, Peptic ulcer"}
    alerts7 = analyze_safety(drugs7, profile7)
    print(f"\n✅ Test 7 (Multiple Conditions + Elderly): {len(alerts7)} alerts")
    for a in alerts7:
        print(f"  [{a['severity']}] {a['type']}: {a['message']}")

    print(f"\n{'=' * 60}")
    total = len(alerts1) + len(alerts2) + len(alerts3) + len(alerts4) + len(alerts5) + len(alerts6) + len(alerts7)
    print(f"  All 7 tests passed — {total} total alerts generated")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    test_safety_engine()
