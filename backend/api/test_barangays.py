
from django.test import SimpleTestCase

from .barangays import CALABANGA_BARANGAYS
from .models import Beneficiary, AicsCase, WomenAndSoloParentCase
from .serializers import BeneficiarySerializer, AicsCaseSerializer, WomenAndSoloParentCaseSerializer


class BarangayCatalogTests(SimpleTestCase):
    def test_catalog_contains_48_unique_names_and_preserves_accents(self):
        self.assertEqual(len(CALABANGA_BARANGAYS), 48)
        self.assertEqual(len(set(CALABANGA_BARANGAYS)), 48)
        self.assertIn('Binanuaanan Peque\u00f1o', CALABANGA_BARANGAYS)
        self.assertIn('Quinale', CALABANGA_BARANGAYS)
        self.assertNotIn('Calabngan-Centro (Town Proper)', CALABANGA_BARANGAYS)
        self.assertIn('Santo Niño', CALABANGA_BARANGAYS)

    def test_all_names_fit_models_and_serializer_fields(self):
        for model, serializer in ((Beneficiary, BeneficiarySerializer), (AicsCase, AicsCaseSerializer), (WomenAndSoloParentCase, WomenAndSoloParentCaseSerializer)):
            field = serializer().fields['barangay_name']
            for name in CALABANGA_BARANGAYS:
                self.assertLessEqual(len(name), model._meta.get_field('barangay_name').max_length)
                self.assertEqual(field.run_validation(name), name)
