#!/usr/bin/env python3
"""
CSS Conflict Resolution Script
==============================

Ce script analyse deux projets web et résout les conflits de classes CSS
en générant des UUIDs uniques pour remplacer les sélecteurs communs.

Auteur: Assistant IA
Version: 1.0
"""

import os
import re
import uuid
import json
import shutil
from pathlib import Path
from bs4 import BeautifulSoup, Comment
import tinycss2
from dataclasses import dataclass, asdict
from typing import Dict, Set, List, Tuple, Optional
import argparse
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('css_conflict_resolution.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ProjectFiles:
    """Structure pour organiser les fichiers d'un projet"""
    html_files: List[Path]
    css_files: List[Path]
    js_files: List[Path]

@dataclass
class SelectorMapping:
    """Mappage d'un sélecteur vers son nouveau nom UUID"""
    original: str
    uuid_name: str
    selector_type: str  # 'class', 'id', 'element'

class CSSParser:
    """Parser CSS utilisant tinycss2"""

    def __init__(self):
        self.selectors = set()

    def extract_selectors_from_css(self, css_content: str) -> Set[str]:
        """Extrait tous les sélecteurs CSS d'un contenu CSS"""
        selectors = set()

        try:
            # Parse le CSS avec tinycss2
            stylesheet = tinycss2.parse_stylesheet(css_content)

            for rule in stylesheet:
                if rule.type == 'qualified-rule':
                    # Extraire les sélecteurs de la règle
                    selector_text = ''.join([token.serialize() for token in rule.prelude]).strip()

                    # Diviser par les virgules pour les sélecteurs multiples
                    for selector in selector_text.split(','):
                        selector = selector.strip()
                        if selector:
                            # Extraire les classes et IDs individuels
                            class_matches = re.findall(r'\.[a-zA-Z][a-zA-Z0-9_-]*', selector)
                            id_matches = re.findall(r'#[a-zA-Z][a-zA-Z0-9_-]*', selector)

                            selectors.update(class_matches)
                            selectors.update(id_matches)

        except Exception as e:
            logger.warning(f"Erreur lors du parsing CSS: {e}")
            # Fallback avec regex si tinycss2 échoue
            selectors.update(self._extract_with_regex(css_content))

        return selectors

    def _extract_with_regex(self, css_content: str) -> Set[str]:
        """Extraction de secours avec regex"""
        selectors = set()

        # Regex pour les classes CSS
        class_pattern = r'\.[a-zA-Z][a-zA-Z0-9_-]*'
        selectors.update(re.findall(class_pattern, css_content))

        # Regex pour les IDs CSS
        id_pattern = r'#[a-zA-Z][a-zA-Z0-9_-]*'
        selectors.update(re.findall(id_pattern, css_content))

        return selectors

    def extract_from_style_tags(self, html_content: str) -> Set[str]:
        """Extrait les sélecteurs des balises <style> dans HTML"""
        selectors = set()
        soup = BeautifulSoup(html_content, 'html.parser')

        for style_tag in soup.find_all('style'):
            if style_tag.string:
                selectors.update(self.extract_selectors_from_css(style_tag.string))

        return selectors

    def extract_inline_selectors(self, html_content: str) -> Set[str]:
        """Extrait les sélecteurs des attributs style inline"""
        selectors = set()
        soup = BeautifulSoup(html_content, 'html.parser')

        # Chercher tous les éléments avec attribut style
        for element in soup.find_all(style=True):
            style_attr = element.get('style', '')
            # Pour les styles inline, on peut extraire des références à des classes
            class_refs = re.findall(r'\.[a-zA-Z][a-zA-Z0-9_-]*', style_attr)
            selectors.update(class_refs)

        return selectors

class HTMLParser:
    """Parser HTML utilisant BeautifulSoup"""

    def extract_classes_and_ids(self, html_content: str) -> Set[str]:
        """Extrait toutes les classes et IDs utilisés dans le HTML"""
        selectors = set()
        soup = BeautifulSoup(html_content, 'html.parser')

        # Extraire toutes les classes
        for element in soup.find_all(class_=True):
            classes = element.get('class', [])
            if isinstance(classes, str):
                classes = classes.split()
            for cls in classes:
                selectors.add(f'.{cls}')

        # Extraire tous les IDs
        for element in soup.find_all(id=True):
            element_id = element.get('id')
            if element_id:
                selectors.add(f'#{element_id}')

        return selectors

class JavaScriptParser:
    """Parser JavaScript pour détecter les références CSS"""

    def __init__(self):
        self.js_patterns = [
            # querySelector et querySelectorAll
            r'querySelector\s*\(\s*["\'](.*?)["\']\\s*\)',
            r'querySelectorAll\s*\(\s*["\'](.*?)["\']\\s*\)',

            # getElementById et getElementsByClassName
            r'getElementById\s*\(\s*["\'](.*?)["\']\\s*\)',
            r'getElementsByClassName\s*\(\s*["\'](.*?)["\']\\s*\)',

            # jQuery selectors
            r'\$\s*\(\s*["\'](.*?)["\']\\s*\)',

            # className assignments
            r'className\s*=\s*["\'](.*?)["\']\\s*',
            r'classList\.add\s*\(\s*["\'](.*?)["\']\\s*\)',
            r'classList\.remove\s*\(\s*["\'](.*?)["\']\\s*\)',
            r'classList\.toggle\s*\(\s*["\'](.*?)["\']\\s*\)',
        ]

    def extract_css_references(self, js_content: str) -> Set[str]:
        """Extrait les références CSS du JavaScript"""
        selectors = set()

        for pattern in self.js_patterns:
            matches = re.finditer(pattern, js_content, re.IGNORECASE | re.MULTILINE)
            for match in matches:
                selector = match.group(1).strip()
                if selector:
                    # Normaliser les sélecteurs
                    if selector.startswith('.') or selector.startswith('#'):
                        selectors.add(selector)
                    elif ' ' not in selector and selector.isidentifier():
                        # Probablement une classe ou un ID
                        selectors.add(f'.{selector}')

        return selectors

class FileCollector:
    """Collecteur de fichiers pour un projet"""

    @staticmethod
    def collect_project_files(directory: Path) -> ProjectFiles:
        """Collecte tous les fichiers HTML, CSS et JS d'un répertoire"""
        if not directory.exists():
            raise FileNotFoundError(f"Le répertoire {directory} n'existe pas")

        html_files = list(directory.rglob('*.html'))
        css_files = list(directory.rglob('*.css'))
        js_files = list(directory.rglob('*.js'))

        logger.info(f"Trouvé {len(html_files)} fichiers HTML, {len(css_files)} CSS, {len(js_files)} JS dans {directory}")

        return ProjectFiles(html_files, css_files, js_files)

class SelectorExtractor:
    """Extracteur principal de sélecteurs"""

    def __init__(self):
        self.css_parser = CSSParser()
        self.html_parser = HTMLParser()
        self.js_parser = JavaScriptParser()

    def extract_all_selectors(self, project_files: ProjectFiles) -> Set[str]:
        """Extrait tous les sélecteurs d'un projet"""
        all_selectors = set()

        # CSS files
        for css_file in project_files.css_files:
            try:
                content = css_file.read_text(encoding='utf-8')
                selectors = self.css_parser.extract_selectors_from_css(content)
                all_selectors.update(selectors)
                logger.debug(f"Extrait {len(selectors)} sélecteurs de {css_file}")
            except Exception as e:
                logger.error(f"Erreur lors de la lecture de {css_file}: {e}")

        # HTML files
        for html_file in project_files.html_files:
            try:
                content = html_file.read_text(encoding='utf-8')
                # Classes et IDs dans les attributs
                selectors_from_attrs = self.html_parser.extract_classes_and_ids(content)
                all_selectors.update(selectors_from_attrs)

                # Sélecteurs dans les balises <style>
                selectors_from_style = self.css_parser.extract_from_style_tags(content)
                all_selectors.update(selectors_from_style)

                # Sélecteurs inline
                selectors_from_inline = self.css_parser.extract_inline_selectors(content)
                all_selectors.update(selectors_from_inline)

                total_selectors = len(selectors_from_attrs) + len(selectors_from_style) + len(selectors_from_inline)
                logger.debug(f"Extrait {total_selectors} sélecteurs de {html_file}")

            except Exception as e:
                logger.error(f"Erreur lors de la lecture de {html_file}: {e}")

        # JavaScript files
        for js_file in project_files.js_files:
            try:
                content = js_file.read_text(encoding='utf-8')
                selectors = self.js_parser.extract_css_references(content)
                all_selectors.update(selectors)
                logger.debug(f"Extrait {len(selectors)} sélecteurs de {js_file}")
            except Exception as e:
                logger.error(f"Erreur lors de la lecture de {js_file}: {e}")

        # Exclure body et html
        excluded = {'.body', '#body', '.html', '#html', 'body', 'html'}
        all_selectors = all_selectors - excluded

        return all_selectors

class UUIDGenerator:
    """Générateur d'UUIDs pour les sélecteurs"""

    @staticmethod
    def generate_uuid_mapping(common_selectors: Set[str]) -> Dict[str, SelectorMapping]:
        """Génère un mapping UUID pour chaque sélecteur commun"""
        mapping = {}

        for selector in common_selectors:
            # Générer un UUID court (8 caractères)
            short_uuid = uuid.uuid4().hex[:8]

            # Déterminer le type de sélecteur
            if selector.startswith('.'):
                selector_type = 'class'
                new_name = f'.uuid-{short_uuid}'
            elif selector.startswith('#'):
                selector_type = 'id'
                new_name = f'#uuid-{short_uuid}'
            else:
                selector_type = 'element'
                new_name = f'uuid-{short_uuid}'

            mapping[selector] = SelectorMapping(
                original=selector,
                uuid_name=new_name,
                selector_type=selector_type
            )

        return mapping

class FileReplacer:
    """Remplacement des sélecteurs dans les fichiers"""

    def __init__(self, mapping: Dict[str, SelectorMapping]):
        self.mapping = mapping

    def replace_in_css(self, css_content: str) -> str:
        """Remplace les sélecteurs dans le contenu CSS"""
        modified_content = css_content

        for original, selector_mapping in self.mapping.items():
            # Remplacement dans les sélecteurs CSS
            # Utiliser une regex plus précise pour éviter les faux positifs
            pattern = re.escape(original) + r'(?=[\s,{:>+~\[\]]|$)'
            modified_content = re.sub(pattern, selector_mapping.uuid_name, modified_content)

        return modified_content

    def replace_in_html(self, html_content: str) -> str:
        """Remplace les sélecteurs dans le HTML"""
        soup = BeautifulSoup(html_content, 'html.parser')

        # Remplacer dans les attributs class
        for element in soup.find_all(class_=True):
            classes = element.get('class', [])
            if isinstance(classes, str):
                classes = classes.split()

            new_classes = []
            for cls in classes:
                original_selector = f'.{cls}'
                if original_selector in self.mapping:
                    new_cls = self.mapping[original_selector].uuid_name[1:]  # Enlever le '.'
                    new_classes.append(new_cls)
                else:
                    new_classes.append(cls)

            element['class'] = new_classes

        # Remplacer dans les attributs id
        for element in soup.find_all(id=True):
            element_id = element.get('id')
            original_selector = f'#{element_id}'
            if original_selector in self.mapping:
                new_id = self.mapping[original_selector].uuid_name[1:]  # Enlever le '#'
                element['id'] = new_id

        # Remplacer dans les balises <style>
        for style_tag in soup.find_all('style'):
            if style_tag.string:
                style_tag.string = self.replace_in_css(style_tag.string)

        # Remplacer dans les attributs style (plus complexe)
        for element in soup.find_all(style=True):
            style_attr = element.get('style', '')
            element['style'] = self.replace_in_css(style_attr)

        return str(soup)

    def replace_in_js(self, js_content: str) -> str:
        """Remplace les sélecteurs dans le JavaScript"""
        modified_content = js_content

        for original, selector_mapping in self.mapping.items():
            # Remplacement dans les chaînes JavaScript
            patterns = [
                # querySelector et querySelectorAll avec guillemets simples
                f"'\\{original}'",
                # querySelector et querySelectorAll avec guillemets doubles
                f'"\\{original}"',
                # getElementById et getElementsByClassName (sans le . ou #)
                f"'{original[1:]}'" if original.startswith(('.', '#')) else f"'{original}'",
                f'"{original[1:]}"' if original.startswith(('.', '#')) else f'"{original}"',
            ]

            for pattern in patterns:
                replacement = pattern.replace(original, selector_mapping.uuid_name)
                modified_content = modified_content.replace(pattern, replacement)

        return modified_content

class ConflictResolver:
    """Résolveur principal de conflits CSS"""

    def __init__(self):
        self.extractor = SelectorExtractor()
        self.file_collector = FileCollector()

    def resolve_conflicts(self, main_project_path: Path, demo_project_path: Path, output_path: Path) -> Dict:
        """Résout les conflits entre deux projets"""
        logger.info("Début de la résolution des conflits CSS")

        # 1. Collecter les fichiers
        main_files = self.file_collector.collect_project_files(main_project_path)
        demo_files = self.file_collector.collect_project_files(demo_project_path)

        # 2. Extraire les sélecteurs
        logger.info("Extraction des sélecteurs du projet principal...")
        main_selectors = self.extractor.extract_all_selectors(main_files)
        logger.info(f"Trouvé {len(main_selectors)} sélecteurs dans le projet principal")

        logger.info("Extraction des sélecteurs de la démo...")
        demo_selectors = self.extractor.extract_all_selectors(demo_files)
        logger.info(f"Trouvé {len(demo_selectors)} sélecteurs dans la démo")

        # 3. Trouver les sélecteurs communs
        common_selectors = main_selectors & demo_selectors
        logger.info(f"Trouvé {len(common_selectors)} sélecteurs communs")

        if not common_selectors:
            logger.info("Aucun conflit détecté, aucune modification nécessaire")
            return {
                'status': 'no_conflicts',
                'common_selectors': [],
                'mapping': {},
                'files_processed': 0
            }

        # 4. Générer les mappings UUID
        logger.info("Génération des mappings UUID...")
        mapping = UUIDGenerator.generate_uuid_mapping(common_selectors)

        # 5. Créer le répertoire de sortie
        output_path.mkdir(parents=True, exist_ok=True)

        # 6. Copier et modifier les fichiers de la démo
        logger.info("Copie et modification des fichiers de la démo...")
        replacer = FileReplacer(mapping)
        files_processed = 0

        # Copier d'abord tous les fichiers
        shutil.copytree(demo_project_path, output_path, dirs_exist_ok=True)

        # Puis modifier les fichiers copiés
        output_demo_files = self.file_collector.collect_project_files(output_path)

        # CSS files
        for css_file in output_demo_files.css_files:
            try:
                content = css_file.read_text(encoding='utf-8')
                modified_content = replacer.replace_in_css(content)
                css_file.write_text(modified_content, encoding='utf-8')
                files_processed += 1
                logger.debug(f"Modifié {css_file}")
            except Exception as e:
                logger.error(f"Erreur lors de la modification de {css_file}: {e}")

        # HTML files
        for html_file in output_demo_files.html_files:
            try:
                content = html_file.read_text(encoding='utf-8')
                modified_content = replacer.replace_in_html(content)
                html_file.write_text(modified_content, encoding='utf-8')
                files_processed += 1
                logger.debug(f"Modifié {html_file}")
            except Exception as e:
                logger.error(f"Erreur lors de la modification de {html_file}: {e}")

        # JavaScript files
        for js_file in output_demo_files.js_files:
            try:
                content = js_file.read_text(encoding='utf-8')
                modified_content = replacer.replace_in_js(content)
                js_file.write_text(modified_content, encoding='utf-8')
                files_processed += 1
                logger.debug(f"Modifié {js_file}")
            except Exception as e:
                logger.error(f"Erreur lors de la modification de {js_file}: {e}")

        # 7. Sauvegarder le mapping
        mapping_file = output_path / 'selector_mapping.json'
        mapping_dict = {
            original: asdict(selector_mapping) 
            for original, selector_mapping in mapping.items()
        }

        with open(mapping_file, 'w', encoding='utf-8') as f:
            json.dump(mapping_dict, f, indent=2, ensure_ascii=False)

        logger.info(f"Résolution terminée. {files_processed} fichiers modifiés.")
        logger.info(f"Mapping sauvegardé dans {mapping_file}")

        return {
            'status': 'success',
            'common_selectors': list(common_selectors),
            'mapping': mapping_dict,
            'files_processed': files_processed,
            'output_path': str(output_path)
        }

def main():
    """Point d'entrée principal du script"""
    parser = argparse.ArgumentParser(
        description='Résout les conflits CSS entre deux projets web'
    )
    parser.add_argument('main_project', type=Path, help='Chemin vers le projet principal')
    parser.add_argument('demo_project', type=Path, help='Chemin vers le projet démo')
    parser.add_argument('output', type=Path, help='Chemin de sortie pour la démo modifiée')
    parser.add_argument('--verbose', '-v', action='store_true', help='Mode verbose')

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Vérifier les chemins
    if not args.main_project.exists():
        logger.error(f"Le projet principal {args.main_project} n'existe pas")
        return 1

    if not args.demo_project.exists():
        logger.error(f"Le projet démo {args.demo_project} n'existe pas")
        return 1

    # Résoudre les conflits
    resolver = ConflictResolver()
    try:
        result = resolver.resolve_conflicts(args.main_project, args.demo_project, args.output)

        if result['status'] == 'success':
            logger.info("\n" + "="*50)
            logger.info("RÉSOLUTION TERMINÉE AVEC SUCCÈS")
            logger.info("="*50)
            logger.info(f"Sélecteurs communs trouvés: {len(result['common_selectors'])}")
            logger.info(f"Fichiers modifiés: {result['files_processed']}")
            logger.info(f"Sortie: {result['output_path']}")
            return 0
        else:
            logger.info("\n" + "="*50)
            logger.info("AUCUN CONFLIT DÉTECTÉ")
            logger.info("="*50)
            return 0

    except Exception as e:
        logger.error(f"Erreur lors de la résolution: {e}")
        return 1

if __name__ == '__main__':
    exit(main())
