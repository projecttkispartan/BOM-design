'use client';

import { useState, useEffect } from 'react';
import { useMasterData } from '@/context/MasterDataContext';
import { Trash2, Plus, Edit2, ChevronDown } from 'lucide-react';
import type { MasterModul, MasterSubModul, MasterMaterial } from '@/types';

type TabType = 'moduls' | 'materials';

export function MasterManagement() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  const { masterData, addModul, updateModul, deleteModul, addSubModul, updateSubModul, deleteSubModul, addMaterial, updateMaterial, deleteMaterial, saveMasterData } = useMasterData();
  const [activeTab, setActiveTab] = useState<TabType>('moduls');
  const [expandedModulId, setExpandedModulId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [editingSubModulId, setEditingSubModulId] = useState<string | null>(null);
  const [subModulForm, setSubModulForm] = useState({ name: '', code: '', description: '' });
  const [materialForm, setMaterialForm] = useState({
    name: '',
    code: '',
    jenis: '',
    grade: '',
    supplier: '',
    unitCost: '',
    description: '',
  });
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [filterJenis, setFilterJenis] = useState('');

  const INPUT_CLASS = 'w-full px-2 py-1 rounded border border-slate-300 text-sm focus:border-sky-500 focus:outline-none';
  const BUTTON_CLASS = 'px-3 py-1.5 rounded text-sm font-medium transition-colors';

  // Modul handlers
  const handleAddModul = () => {
    if (formData.name.trim()) {
      addModul(formData.name, formData.code, formData.description);
      setFormData({ name: '', code: '', description: '' });
      saveMasterData();
    }
  };

  const handleUpdateModul = (id: string) => {
    updateModul(id, formData);
    setEditingId(null);
    setFormData({ name: '', code: '', description: '' });
    saveMasterData();
  };

  const handleDeleteModul = (id: string) => {
    if (confirm('Hapus modul ini? SubModul yang terkait akan ikut terhapus.')) {
      deleteModul(id);
      setExpandedModulId(null);
      saveMasterData();
    }
  };

  // SubModul handlers
  const handleAddSubModul = (modulId: string) => {
    if (subModulForm.name.trim()) {
      addSubModul(modulId, subModulForm.name, subModulForm.code, subModulForm.description);
      setSubModulForm({ name: '', code: '', description: '' });
      saveMasterData();
    }
  };

  const handleUpdateSubModul = (id: string) => {
    updateSubModul(id, subModulForm);
    setEditingSubModulId(null);
    setSubModulForm({ name: '', code: '', description: '' });
    saveMasterData();
  };

  const handleDeleteSubModul = (id: string) => {
    if (confirm('Hapus sub-modul ini?')) {
      deleteSubModul(id);
      saveMasterData();
    }
  };

  // Material handlers
  const handleAddMaterial = () => {
    if (materialForm.name.trim()) {
      addMaterial(
        materialForm.name,
        materialForm.code,
        materialForm.jenis,
        materialForm.grade,
        materialForm.supplier,
        materialForm.unitCost,
        materialForm.description
      );
      setMaterialForm({ name: '', code: '', jenis: '', grade: '', supplier: '', unitCost: '', description: '' });
      saveMasterData();
    }
  };

  const handleUpdateMaterial = (id: string) => {
    updateMaterial(id, materialForm);
    setEditingMaterialId(null);
    setMaterialForm({ name: '', code: '', jenis: '', grade: '', supplier: '', unitCost: '', description: '' });
    saveMasterData();
  };

  const handleDeleteMaterial = (id: string) => {
    if (confirm('Hapus material ini?')) {
      deleteMaterial(id);
      saveMasterData();
    }
  };

  const startEditModul = (modul: MasterModul) => {
    setEditingId(modul.id);
    setFormData({ name: modul.name, code: modul.code || '', description: modul.description || '' });
  };

  const startEditSubModul = (subModul: MasterSubModul) => {
    setEditingSubModulId(subModul.id);
    setSubModulForm({ name: subModul.name, code: subModul.code || '', description: subModul.description || '' });
  };

  const startEditMaterial = (material: MasterMaterial) => {
    setEditingMaterialId(material.id);
    setMaterialForm({
      name: material.name,
      code: material.code || '',
      jenis: material.jenis || '',
      grade: material.grade || '',
      supplier: material.supplier || '',
      unitCost: material.unitCost || '',
      description: material.description || '',
    });
  };

  const uniqueJenis = Array.from(new Set(masterData.materials.map((m) => m.jenis).filter(Boolean)));
  const filteredMaterials = filterJenis ? masterData.materials.filter((m) => m.jenis === filterJenis) : masterData.materials;

  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200">
      <div className="flex gap-2 mb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('moduls')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'moduls' ? 'text-sky-600 border-sky-600' : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Modul & Sub-Modul
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'materials' ? 'text-sky-600 border-sky-600' : 'text-slate-600 border-transparent hover:text-slate-900'
          }`}
        >
          Materials
        </button>
      </div>

      {!mounted ? (
        <div className="py-8 text-center text-slate-500 text-sm">Memuat...</div>
      ) : (
        <>
      {/* MODULS TAB */}
      {activeTab === 'moduls' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <h3 className="font-semibold text-sm mb-3">Tambah Modul Baru</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nama Modul"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={INPUT_CLASS}
              />
              <input
                type="text"
                placeholder="Kode (opsional)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={INPUT_CLASS}
              />
              <textarea
                placeholder="Deskripsi (opsional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className={INPUT_CLASS}
              />
              <button onClick={handleAddModul} className={`${BUTTON_CLASS} bg-sky-500 text-white hover:bg-sky-600 w-full`}>
                <Plus className="w-4 h-4 inline mr-1" />
                Tambah Modul
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {masterData.moduls.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">Belum ada modul. Tambahkan yang baru.</p>
            ) : (
              masterData.moduls.map((modul) => (
                <div key={modul.id} className="border border-slate-200 rounded">
                  <div className="bg-slate-50 p-3 flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer flex items-center gap-2"
                      onClick={() => setExpandedModulId(expandedModulId === modul.id ? null : modul.id)}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${expandedModulId === modul.id ? '' : '-rotate-90'}`}
                      />
                      <div>
                        <div className="font-medium text-sm">{modul.name}</div>
                        <div className="text-xs text-slate-500">
                          {modul.code && `Kode: ${modul.code}`}
                          {modul.usageCount > 0 && ` • Digunakan: ${modul.usageCount}x`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditModul(modul)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModul(modul.id)}
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {editingId === modul.id && (
                    <div className="p-3 bg-white border-t border-slate-200">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={INPUT_CLASS}
                      />
                      <input
                        type="text"
                        placeholder="Kode"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className={`${INPUT_CLASS} mt-2`}
                      />
                      <textarea
                        placeholder="Deskripsi"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                        className={`${INPUT_CLASS} mt-2`}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleUpdateModul(modul.id)}
                          className={`${BUTTON_CLASS} bg-green-500 text-white hover:bg-green-600 flex-1`}
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={`${BUTTON_CLASS} bg-slate-300 hover:bg-slate-400`}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {expandedModulId === modul.id && (
                    <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                      <div className="text-sm font-medium mb-2">Sub-Modul</div>
                      {masterData.submoduls
                        .filter((s) => s.modulId === modul.id)
                        .map((submodul) => (
                          <div key={submodul.id} className="bg-slate-50 p-2 rounded flex items-center justify-between">
                            <div className="text-sm">
                              <div className="font-medium">{submodul.name}</div>
                              <div className="text-xs text-slate-500">
                                {submodul.code && `Kode: ${submodul.code}`}
                                {submodul.usageCount > 0 && ` • Digunakan: ${submodul.usageCount}x`}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditSubModul(submodul)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSubModul(submodul.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                      {editingSubModulId &&
                        masterData.submoduls.find((s) => s.id === editingSubModulId)?.modulId === modul.id && (
                          <div className="bg-white p-2 border border-sky-300 rounded">
                            <input
                              type="text"
                              value={subModulForm.name}
                              onChange={(e) => setSubModulForm({ ...subModulForm, name: e.target.value })}
                              className={`${INPUT_CLASS} text-sm`}
                              placeholder="Nama Sub-Modul"
                            />
                            <input
                              type="text"
                              placeholder="Kode"
                              value={subModulForm.code}
                              onChange={(e) => setSubModulForm({ ...subModulForm, code: e.target.value })}
                              className={`${INPUT_CLASS} text-sm mt-1`}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateSubModul(editingSubModulId)}
                                className={`${BUTTON_CLASS} bg-green-500 text-white hover:bg-green-600 text-xs flex-1`}
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingSubModulId(null)}
                                className={`${BUTTON_CLASS} bg-slate-300 hover:bg-slate-400 text-xs flex-1`}
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        )}

                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <div className="text-xs font-medium mb-2 text-blue-900">Tambah Sub-Modul</div>
                        <input
                          type="text"
                          placeholder="Nama Sub-Modul"
                          value={subModulForm.name}
                          onChange={(e) => setSubModulForm({ ...subModulForm, name: e.target.value })}
                          className={`${INPUT_CLASS} text-sm mb-1`}
                        />
                        <input
                          type="text"
                          placeholder="Kode (opsional)"
                          value={subModulForm.code}
                          onChange={(e) => setSubModulForm({ ...subModulForm, code: e.target.value })}
                          className={`${INPUT_CLASS} text-sm mb-1`}
                        />
                        <button
                          onClick={() => handleAddSubModul(modul.id)}
                          className={`${BUTTON_CLASS} bg-blue-500 text-white hover:bg-blue-600 w-full text-sm`}
                        >
                          <Plus className="w-3 h-3 inline mr-1" />
                          Tambah Sub-Modul
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MATERIALS TAB */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <h3 className="font-semibold text-sm mb-3">Tambah Material Baru</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Material"
                value={materialForm.name}
                onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                className={INPUT_CLASS}
              />
              <input
                type="text"
                placeholder="Kode"
                value={materialForm.code}
                onChange={(e) => setMaterialForm({ ...materialForm, code: e.target.value })}
                className={INPUT_CLASS}
              />
              <input
                type="text"
                placeholder="Jenis (KAYU, ENGINEERED, dll)"
                value={materialForm.jenis}
                onChange={(e) => setMaterialForm({ ...materialForm, jenis: e.target.value })}
                className={INPUT_CLASS}
              />
              <input
                type="text"
                placeholder="Grade (A, B, C, dll)"
                value={materialForm.grade}
                onChange={(e) => setMaterialForm({ ...materialForm, grade: e.target.value })}
                className={INPUT_CLASS}
              />
              <input
                type="text"
                placeholder="Supplier (opsional)"
                value={materialForm.supplier}
                onChange={(e) => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                className={INPUT_CLASS}
              />
              <input
                type="text"
                placeholder="Unit Cost (opsional)"
                value={materialForm.unitCost}
                onChange={(e) => setMaterialForm({ ...materialForm, unitCost: e.target.value })}
                className={INPUT_CLASS}
              />
              <textarea
                placeholder="Deskripsi (opsional)"
                value={materialForm.description}
                onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
                rows={2}
                className={`${INPUT_CLASS} col-span-2`}
              />
              <button
                onClick={handleAddMaterial}
                className={`${BUTTON_CLASS} bg-sky-500 text-white hover:bg-sky-600 col-span-2`}
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Tambah Material
              </button>
            </div>
          </div>

          {uniqueJenis.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterJenis('')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filterJenis === '' ? 'bg-sky-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
                }`}
              >
                Semua
              </button>
              {uniqueJenis.map((jenis) => (
                <button
                  key={jenis}
                  onClick={() => setFilterJenis(jenis || '')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    filterJenis === jenis ? 'bg-sky-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
                  }`}
                >
                  {jenis}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {filteredMaterials.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">Tidak ada material. Tambahkan yang baru.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b border-slate-300">
                    <tr>
                      <th className="p-2 text-left font-semibold">Nama</th>
                      <th className="p-2 text-left font-semibold">Kode</th>
                      <th className="p-2 text-left font-semibold">Jenis</th>
                      <th className="p-2 text-left font-semibold">Grade</th>
                      <th className="p-2 text-left font-semibold">Supplier</th>
                      <th className="p-2 text-center font-semibold">Digunakan</th>
                      <th className="p-2 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map((material) => (
                      <tr key={material.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="p-2">{material.name}</td>
                        <td className="p-2 text-slate-500">{material.code || '—'}</td>
                        <td className="p-2 text-slate-500">{material.jenis || '—'}</td>
                        <td className="p-2 text-slate-500">{material.grade || '—'}</td>
                        <td className="p-2 text-slate-500">{material.supplier || '—'}</td>
                        <td className="p-2 text-center text-slate-500">{material.usageCount}x</td>
                        <td className="p-2 text-center flex gap-1 justify-center">
                          <button
                            onClick={() => startEditMaterial(material)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editingMaterialId && (
            <div className="bg-slate-50 p-3 rounded border border-slate-200 fixed bottom-0 left-0 right-0 z-50 m-4">
              <h3 className="font-semibold text-sm mb-3">Edit Material</h3>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  placeholder="Kode"
                  value={materialForm.code}
                  onChange={(e) => setMaterialForm({ ...materialForm, code: e.target.value })}
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  placeholder="Jenis"
                  value={materialForm.jenis}
                  onChange={(e) => setMaterialForm({ ...materialForm, jenis: e.target.value })}
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  placeholder="Grade"
                  value={materialForm.grade}
                  onChange={(e) => setMaterialForm({ ...materialForm, grade: e.target.value })}
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  placeholder="Supplier"
                  value={materialForm.supplier}
                  onChange={(e) => setMaterialForm({ ...materialForm, supplier: e.target.value })}
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  placeholder="Unit Cost"
                  value={materialForm.unitCost}
                  onChange={(e) => setMaterialForm({ ...materialForm, unitCost: e.target.value })}
                  className={INPUT_CLASS}
                />
                <div className="flex gap-2 col-span-2">
                  <button
                    onClick={() => handleUpdateMaterial(editingMaterialId)}
                    className={`${BUTTON_CLASS} bg-green-500 text-white hover:bg-green-600 flex-1`}
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditingMaterialId(null)}
                    className={`${BUTTON_CLASS} bg-slate-400 text-white hover:bg-slate-500 flex-1`}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
