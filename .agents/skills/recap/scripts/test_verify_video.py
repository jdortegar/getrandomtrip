"""Mock-only verifier contract checks; placeholder files are NOT real videos."""
import importlib.util
import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
HELPER = pathlib.Path(__file__).with_name('verify-video.py')
spec = importlib.util.spec_from_file_location('verify_video', HELPER)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class MockVideoChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory(prefix='recap-verifier-')
        cls.root = pathlib.Path(cls.temp_dir.name)
        cls.fixture = cls.root / 'mock-metadata-only.mp4'
        cls.fixture.write_bytes(b'SYNTHETIC PLACEHOLDER FOR MOCK TESTS ONLY; NOT A VIDEO')

    @classmethod
    def tearDownClass(cls):
        cls.temp_dir.cleanup()

    def metadata(self, duration='15'):
        return {'format': {'format_name': 'mov,mp4,m4a,3gp,3g2,mj2', 'duration': duration,
                           'tags': {'major_brand': 'isom'}},
                'streams': [{'codec_type': 'video', 'codec_name': 'h264', 'width': 3456,
                             'height': 2234, 'r_frame_rate': '60/1', 'avg_frame_rate': '60/1'}]}

    def probe(self, data):
        return subprocess.CompletedProcess([], 0, json.dumps(data), '')

    def reject(self, data, message):
        with patch.object(module.subprocess, 'run', return_value=self.probe(data)) as mocked:
            with self.assertRaisesRegex(ValueError, message): module.verify(self.fixture)
            self.assertEqual(mocked.call_count, 1, 'Rejected metadata must not reach decoder')

    def test_success_and_exact_15_seconds_boundary(self):
        decoder = subprocess.CompletedProcess([], 0, '', '')
        with patch.object(module.subprocess, 'run', side_effect=[self.probe(self.metadata()), decoder]) as mocked:
            result = module.verify(self.fixture)
            self.assertEqual(result['duration_seconds'], 15)
            self.assertTrue(result['decoded'])
            self.assertEqual((result['width'], result['height'], result['fps']), (3456, 2234, 60))
            self.assertEqual(result['bytes'], self.fixture.stat().st_size)
            self.assertEqual(result['file'], str(self.fixture.resolve()))
            self.assertEqual(mocked.call_count, 2)
            decode_call = mocked.call_args_list[1]
            self.assertIn('-xerror', decode_call.args[0])
            self.assertIn('-nostdin', decode_call.args[0])
            self.assertTrue(decode_call.kwargs['check'])

    def test_invalid_duration_boundaries(self):
        for value in ('0', '-1', '15.00001', 'NaN', 'Infinity'):
            with self.subTest(value=value): self.reject(self.metadata(value), 'Duration is')

    def test_container(self):
        data = self.metadata()
        data['format']['format_name'] = 'matroska,webm'
        self.reject(data, 'Expected an MP4 media container')

    def test_non_mp4_or_missing_brand(self):
        for brand in ('qt  ', '3gp4', '3g2a', 'mjp2', 'unknown', ''):
            data = self.metadata()
            data['format']['tags'] = {'major_brand': brand, 'compatible_brands': 'mp41mp42'}
            with self.subTest(brand=brand): self.reject(data, 'Expected recognized MP4 major branding')
        data = self.metadata()
        del data['format']['tags']
        self.reject(data, 'Expected recognized MP4 major branding')

    def test_recognized_mp4_brands(self):
        for brand in ('isom', 'iso2', 'iso6', 'mp41', 'mp42', 'avc1', 'M4V ', 'MSNV', 'dash'):
            data = self.metadata()
            data['format']['tags']['major_brand'] = brand
            decoder = subprocess.CompletedProcess([], 0, '', '')
            with self.subTest(brand=brand), patch.object(module.subprocess, 'run', side_effect=[self.probe(data), decoder]):
                self.assertTrue(module.verify(self.fixture)['decoded'])

    def test_dimensions_and_codec(self):
        for field, value, message in [('width', 1728, 'Expected native'), ('height', 1117, 'Expected native'), ('codec_name', 'vp9', 'Expected H.264')]:
            data = self.metadata()
            data['streams'][0][field] = value
            with self.subTest(field=field): self.reject(data, message)

    def test_each_frame_rate_field(self):
        for field in ('r_frame_rate', 'avg_frame_rate'):
            data = self.metadata()
            data['streams'][0][field] = '60000/1001'
            with self.subTest(field=field): self.reject(data, '60 FPS')

    def test_stream_count(self):
        for streams in ([], [{'codec_type': 'audio'}], self.metadata()['streams'] * 2):
            data = self.metadata()
            data['streams'] = streams
            with self.subTest(streams=streams): self.reject(data, 'Expected exactly one video stream')

    def test_decode_failure_propagates(self):
        failed_decode = subprocess.CalledProcessError(1, ['ffmpeg'])
        with patch.object(module.subprocess, 'run', side_effect=[self.probe(self.metadata()), failed_decode]):
            with self.assertRaises(subprocess.CalledProcessError): module.verify(self.fixture)

    def test_path_preflight(self):
        wrong_suffix = self.root / 'mock.webm'
        wrong_suffix.write_bytes(b'NOT A VIDEO')
        with patch.object(module.subprocess, 'run') as mocked:
            with self.assertRaises(ValueError): module.verify(wrong_suffix)
            with self.assertRaises(FileNotFoundError): module.verify(self.root / 'absent.mp4')
            mocked.assert_not_called()

    def test_cli_usage_and_missing_file_errors(self):
        for args, expected in [([], 'Usage:'), ([str(self.root / 'absent.mp4')], 'Recap validation failed')]:
            with self.subTest(args=args):
                result = subprocess.run([sys.executable, str(HELPER), *args], capture_output=True, text=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(expected, result.stderr)
                self.assertNotIn('Traceback', result.stderr)

if __name__ == '__main__': unittest.main(verbosity=2)
