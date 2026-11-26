import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Building2, 
  Store, 
  Package, 
  Crown,
  Edit3,
  TrendingUp,
  TrendingDown,
  Scale,
  Zap,
  Trash2,
  Search,
  ShieldCheck,
  ArrowRight,
  Lock,
  Activity
} from 'lucide-react';
import DailyBatchWorksheetModal from './DailyBatchWorksheetModal';
import LiveFloorMonitor from './LiveFloorMonitor';
import PrintableJobSlipModal from './PrintableJobSlipModal';
import BatchPrintSlipsModal from './BatchPrintSlipsModal';
import VisualDesignPickerModal from './VisualDesignPickerModal';
import { 
  STANDARD_METALS, 
  getMetalScrapCeiling, 
  calculateDynamicETA, 
  timeStringToMinutes 
} from '../utils/floorTiming';
import { getCraftingMethodInfo } from '../utils/craftingRoutes';
import { getDesignDisplayImage, getLuxuryJewellerySvg } from '../utils/designImages';
import { QrCode, Printer, X, Camera } from 'lucide-react';

export { STANDARD_METALS, getMetalScrapCeiling, calculateDynamicETA, timeStringToMinutes };

export default function AllocationsView({ 
  allocations, 
  craftsmen, 
  designs, 
  leaves, 
  clientShops = [],
  targetDate,
  onAddAllocation, 
  onUpdateAllocation, 
  onDeleteAllocation, 
  onClearAllAllocations,
  onAddClientShop,
  onUpdateClientShop,
  onDeleteClientShop
}) {
  const [showModal, setShowModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [printingSlipOrder, setPrintingSlipOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAllocForEdit, setSelectedAllocForEdit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // State for Overnight Carry-Over Modal
  const [showCarryModal, setShowCarryModal] = useState(false);
  const [carryAlloc, setCarryAlloc] = useState(null);
  const [carryTodayHours, setCarryTodayHours] = useState('8.0');
  const [carryTodayCompletedQty, setCarryTodayCompletedQty] = useState(0);
  const [carryNextDate, setCarryNextDate] = useState('');
  const [carryRemainingHours, setCarryRemainingHours] = useState('4.0');
  const [carryVaultGrams, setCarryVaultGrams] = useState('');

  // State for External Client Shops Management
  const [showShopsModal, setShowShopsModal] = useState(false);
  const [showQuickAddShop, setShowQuickAddShop] = useState(false);
  const [quickShopName, setQuickShopName] = useState('');
  const [quickShopLocation, setQuickShopLocation] = useState('');
  const [quickShopLossPct, setQuickShopLossPct] = useState('3.5');
  const [isSubmittingShop, setIsSubmittingShop] = useState(false);
  const [shopFilter, setShopFilter] = useState('ALL');

  const [newShopForm, setNewShopForm] = useState({
    name: '',
    location: '',
    contactPerson: '',
    phone: '',
    agreedLossPct: '3.5',
    billingModel: 'Contract SMT + 3.5% Loss',
    notes: ''
  });

  // Form state for new dispatch
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [craftsmanId, setCraftsmanId] = useState(craftsmen && craftsmen[0] ? craftsmen[0].id : '');
  const [designCode, setDesignCode] = useState(designs && designs[0] ? designs[0].code : '');
  const [qty, setQty] = useState(4);
  const [customAssumedHours, setCustomAssumedHours] = useState('');
  const [dispatchActualHours, setDispatchActualHours] = useState('');
  const [channel, setChannel] = useState('OWN_SHOWROOM');
  const [channelName, setChannelName] = useState('Ashadi Main Branch (Kaduwela)');
  const [workOrder, setWorkOrder] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [metalFilter, setMetalFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('LIVE_MONITOR'); // 'LIVE_MONITOR' or 'LEDGER'
  const [dispatchTime, setDispatchTime] = useState('07:00');
  const [metalType, setMetalType] = useState('Gold 22K');
  const [craftingMethodDispatch, setCraftingMethodDispatch] = useState('HANDMADE');
  const [customMetalsList, setCustomMetalsList] = useState(['Gold 14K Yellow', 'Gold 14K White', 'Gold 14K Rose', 'Gold 9K', 'Gold 24K', 'Platinum 900', 'Palladium 950', 'Silver 999', 'Brass / Bronze']);
  const [isCustomMetalDispatch, setIsCustomMetalDispatch] = useState(false);
  const [customMetalInput, setCustomMetalInput] = useState('');
  const [isCustomMetalEdit, setIsCustomMetalEdit] = useState(false);
  const [customMetalEditInput, setCustomMetalEditInput] = useState('');
  const [goldIssuedGrams, setGoldIssuedGrams] = useState('');
  const [dispatchGoldReturned, setDispatchGoldReturned] = useState('');

  // Multi-Item Jewellery Suite / Set State (each item has its own craftingMethod)
  const [isSuiteDispatch, setIsSuiteDispatch] = useState(false);
  const [suiteName, setSuiteName] = useState('Bridal / Jewellery Suite');
  const [suiteItems, setSuiteItems] = useState([
    { designCode: 'RNG-SOL-03', qty: 1, metalType: 'Gold 22K', craftingMethod: 'HANDMADE' },
    { designCode: 'NCK-FLR-02', qty: 1, metalType: 'Gold 22K', craftingMethod: 'HANDMADE' },
    { designCode: 'ERR-DRP-01', qty: 2, metalType: 'Gold 22K', craftingMethod: 'HANDMADE' }
  ]);

  // Visual Design Picker Modal State (for Single, Suite & Edit Modals)
  const [visualPickerState, setVisualPickerState] = useState(null);

  const handleSelectDesignFromVisualPicker = (selectedDesign) => {
    if (!visualPickerState) return;
    const { mode, itemIdx } = visualPickerState;

    if (mode === 'SINGLE_DISPATCH') {
      setDesignCode(selectedDesign.code);
      if (selectedDesign.metalType) setMetalType(selectedDesign.metalType);
      if (selectedDesign.craftingMethod) setCraftingMethodDispatch(selectedDesign.craftingMethod);
    } else if (mode === 'SUITE_DISPATCH' && itemIdx !== null) {
      setSuiteItems(prev => prev.map((it, i) => i === itemIdx ? {
        ...it,
        designCode: selectedDesign.code,
        craftingMethod: selectedDesign.craftingMethod || it.craftingMethod || 'HANDMADE'
      } : it));
    } else if (mode === 'SINGLE_EDIT') {
      const q = parseInt(editForm.qtyAllocated, 10) || 1;
      const smt = selectedDesign.totalSMT * q;
      setEditForm(prev => ({
        ...prev,
        designCode: selectedDesign.code,
        metalType: selectedDesign.metalType || prev.metalType,
        assumedHours: (smt / 60).toFixed(2)
      }));
    } else if (mode === 'SUITE_EDIT' && itemIdx !== null) {
      setEditForm(prev => {
        const newItems = prev.items.map((item, i) => i === itemIdx ? {
          ...item,
          designCode: selectedDesign.code,
          craftingMethod: selectedDesign.craftingMethod || item.craftingMethod || 'HANDMADE'
        } : item);
        const smt = newItems.reduce((acc, x) => {
          const dItem = (designs || []).find(ds => ds.code === x.designCode);
          return acc + ((dItem ? dItem.totalSMT : 60) * (parseInt(x.qty, 10) || 1));
        }, 0);
        return { ...prev, items: newItems, assumedHours: (smt / 60).toFixed(2) };
      });
    }

    setVisualPickerState(null);
  };

  // Keep craftsmanId & designCode synced when data loads
  useEffect(() => {
    if (!craftsmanId && craftsmen && craftsmen.length > 0) {
      setCraftsmanId(craftsmen[0].id);
    }
  }, [craftsmen]);

  useEffect(() => {
    if (!designCode && designs && designs.length > 0) {
      setDesignCode(designs[0].code);
      setSuiteItems(prev => prev.map((item, idx) => {
        const found = designs.find(d => d.code === item.designCode);
        if (found) return { ...item, craftingMethod: item.craftingMethod || found.craftingMethod || 'HANDMADE' };
        const fallback = designs[idx % designs.length];
        return {
          ...item,
          designCode: fallback ? fallback.code : item.designCode,
          craftingMethod: item.craftingMethod || fallback?.craftingMethod || 'HANDMADE'
        };
      }));
    }
  }, [designs]);

  useEffect(() => {
    const onHighlight = () => {
      setViewMode('LIVE_MONITOR');
    };
    window.addEventListener('ashadi:highlight_bench', onHighlight);
    return () => window.removeEventListener('ashadi:highlight_bench', onHighlight);
  }, []);

  // Form state for full edit modal
  const [editForm, setEditForm] = useState({
    date: '',
    craftsmanId: '',
    channel: 'OWN_SHOWROOM',
    channelName: '',
    workOrder: '',
    metalType: 'Gold 22K',
    designCode: '',
    qtyAllocated: 1,
    assumedHours: 8.0,
    actualHours: '',
    goldIssuedGrams: '',
    goldReturnedGrams: '',
    status: 'Completed'
  });

  const selectedCraftsman = (craftsmen || []).find(c => c.id === craftsmanId) || (craftsmen && craftsmen[0]);
  const selectedDesign = (designs || []).find(d => d.code === designCode) || (designs && designs[0]);

  // Suite calculations
  const suiteTotalSMT = suiteItems.reduce((acc, it) => {
    const d = (designs || []).find(x => x.code === it.designCode);
    const unit = d ? d.totalSMT : 60;
    return acc + (unit * (parseInt(it.qty, 10) || 1));
  }, 0);
  const suiteTotalQty = suiteItems.reduce((acc, it) => acc + (parseInt(it.qty, 10) || 1), 0);

  const budgetedSMT = isSuiteDispatch 
    ? parseFloat(suiteTotalSMT.toFixed(1)) 
    : (selectedDesign ? parseFloat((selectedDesign.totalSMT * qty).toFixed(1)) : 0);
  const calculatedAssumedHours = parseFloat((budgetedSMT / 60).toFixed(2));
  const isOverBudget = budgetedSMT > 550;

  const filteredAllocations = (allocations || []).filter(a => {
    const allocMetal = a.metalType || (a.designCode && a.designCode.startsWith('PLT-') ? 'Platinum 950' : a.designCode && a.designCode.startsWith('SLV-') ? 'Silver 925' : 'Gold 22K');
    let matchesMetal = metalFilter === 'ALL';
    if (!matchesMetal) {
      const lower = allocMetal.toLowerCase();
      if (metalFilter === '22K_24K') matchesMetal = lower.includes('22k') || lower.includes('24k') || lower.includes('pure');
      else if (metalFilter === '18K') matchesMetal = lower.includes('18k') || lower.includes('750');
      else if (metalFilter === '14K_9K') matchesMetal = lower.includes('14k') || lower.includes('9k') || lower.includes('585');
      else if (metalFilter === 'PLATINUM') matchesMetal = lower.includes('platinum') || lower.includes('palladium') || lower.includes('plt') || lower.includes('pd');
      else if (metalFilter === 'SILVER') matchesMetal = lower.includes('silver') || lower.includes('slv') || lower.includes('925') || lower.includes('999');
      else if (metalFilter === 'OTHER') matchesMetal = lower.includes('brass') || lower.includes('bronze') || lower.includes('copper') || (!lower.includes('gold') && !lower.includes('silver') && !lower.includes('platinum') && !lower.includes('palladium'));
      else matchesMetal = allocMetal === metalFilter;
    }
    const matchesChannel = channelFilter === 'ALL' || a.channel === channelFilter;
    const matchesMonth = monthFilter === 'ALL' || (a.date && a.date.startsWith(monthFilter));
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (a.workOrder && a.workOrder.toLowerCase().includes(q)) ||
      (a.id && a.id.toLowerCase().includes(q)) ||
      (a.craftsmanName && a.craftsmanName.toLowerCase().includes(q)) ||
      (((craftsmen || []).find(c => c.id === a.craftsmanId)?.name || '').toLowerCase().includes(q)) ||
      (a.craftsmanId && a.craftsmanId.toLowerCase().includes(q)) ||
      (a.channelName && a.channelName.toLowerCase().includes(q)) ||
      (a.designCode && a.designCode.toLowerCase().includes(q)) ||
      (a.suiteName && a.suiteName.toLowerCase().includes(q)) ||
      (a.items && a.items.some(it => (it.designCode && it.designCode.toLowerCase().includes(q)) || (it.designName && it.designName.toLowerCase().includes(q)))) ||
      (allocMetal.toLowerCase().includes(q));
    return matchesMetal && matchesChannel && matchesMonth && matchesSearch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCraftsmanId = craftsmanId || (craftsmen && craftsmen[0] ? craftsmen[0].id : 'C001');
    const finalDesignCode = designCode || (designs && designs[0] ? designs[0].code : 'RNG-SMP-01');
    const finalQty = parseInt(qty, 10) || 1;
    const assumed = customAssumedHours ? parseFloat(customAssumedHours) : calculatedAssumedHours;

    let payload = {
      craftsmanId: finalCraftsmanId,
      dispatchTime: dispatchTime || '08:30',
      assumedHours: assumed,
      actualHours: dispatchActualHours ? parseFloat(dispatchActualHours) : null,
      goldIssuedGrams: goldIssuedGrams ? parseFloat(goldIssuedGrams) : null,
      goldReturnedGrams: dispatchGoldReturned ? parseFloat(dispatchGoldReturned) : null,
      channel,
      channelName: channelName || (
        channel === 'EXTERNAL_SHOP' ? 'External Jeweller Order' :
        channel === 'OWN_SHOWROOM' ? 'Ashadi Branch Showroom' :
        channel === 'FACTORY_STOCK' ? 'Central Factory Stock' : 'Owner VIP Special'
      ),
      workOrder: workOrder || `WO-${channel.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
      date: dispatchDate || new Date().toISOString().split('T')[0]
    };

    if (isSuiteDispatch) {
      const populatedItems = suiteItems.map(it => {
        const d = (designs || []).find(x => x.code === it.designCode);
        const itemQty = parseInt(it.qty, 10) || 1;
        const unit = d ? d.totalSMT : 60;
        return {
          designCode: it.designCode,
          designName: d?.name || it.designCode,
          qty: itemQty,
          unitSMT: unit,
          totalSMT: parseFloat((unit * itemQty).toFixed(1)),
          metalType: it.metalType || metalType || 'Gold 22K',
          craftingMethod: it.craftingMethod || 'HANDMADE'
        };
      });
      const totalPieces = populatedItems.reduce((acc, it) => acc + it.qty, 0);
      const uniqueMethods = [...new Set(populatedItems.map(it => it.craftingMethod))];
      const suiteMainMethod = uniqueMethods.length === 1 ? uniqueMethods[0] : 'MIXED';

      payload = {
        ...payload,
        isSuite: true,
        suiteName: suiteName || 'Jewellery Suite / Set',
        designCode: populatedItems[0]?.designCode || 'SUITE-SET',
        designName: suiteName || 'Jewellery Suite / Set',
        metalType: metalType || 'Gold 22K',
        craftingMethod: suiteMainMethod,
        qtyAllocated: totalPieces,
        budgetedSMT,
        items: populatedItems
      };
    } else {
      payload = {
        ...payload,
        isSuite: false,
        designCode: finalDesignCode,
        metalType: metalType || 'Gold 22K',
        craftingMethod: craftingMethodDispatch || 'HANDMADE',
        qtyAllocated: finalQty,
        budgetedSMT
      };
    }

    onAddAllocation(payload);
    setShowModal(false);
    setCustomAssumedHours('');
    setDispatchActualHours('');
    setGoldIssuedGrams('');
    setDispatchGoldReturned('');
  };

  const handleOpenEditModal = (alloc) => {
    setSelectedAllocForEdit(alloc);
    const allocMetal = alloc.metalType || (alloc.designCode && alloc.designCode.startsWith('PLT-') ? 'Platinum 950' : alloc.designCode && alloc.designCode.startsWith('SLV-') ? 'Silver 925' : 'Gold 22K');
    const hasActual = alloc.actualHours !== null && alloc.actualHours !== undefined && alloc.actualHours !== '';
    setEditForm({
      date: alloc.date || '',
      craftsmanId: alloc.craftsmanId || '',
      channel: alloc.channel || 'OWN_SHOWROOM',
      channelName: alloc.channelName || '',
      workOrder: alloc.workOrder || '',
      metalType: allocMetal,
      designCode: alloc.designCode || '',
      qtyAllocated: alloc.qtyAllocated || 1,
      assumedHours: alloc.assumedHours || (alloc.budgetedSMT ? (alloc.budgetedSMT / 60).toFixed(2) : 8.0),
      actualHours: hasActual ? String(alloc.actualHours) : '',
      goldIssuedGrams: alloc.goldIssuedGrams !== null && alloc.goldIssuedGrams !== undefined ? String(alloc.goldIssuedGrams) : '',
      goldReturnedGrams: alloc.goldReturnedGrams !== null && alloc.goldReturnedGrams !== undefined ? String(alloc.goldReturnedGrams) : '',
      status: alloc.status || (hasActual ? 'Completed' : 'In Progress'),
      isSuite: !!alloc.isSuite,
      suiteName: alloc.suiteName || (alloc.isSuite ? 'Jewellery Suite / Set' : ''),
      items: Array.isArray(alloc.items) && alloc.items.length > 0
        ? alloc.items.map(it => ({ ...it, craftingMethod: it.craftingMethod || alloc.craftingMethod || 'HANDMADE' }))
        : [{ designCode: alloc.designCode || 'RNG-SMP-01', qty: alloc.qtyAllocated || 1, metalType: allocMetal, craftingMethod: alloc.craftingMethod || 'HANDMADE' }]
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!selectedAllocForEdit || !onUpdateAllocation) return;

    const targetId = selectedAllocForEdit.id || selectedAllocForEdit._id;
    const isSuite = !!editForm.isSuite;

    let finalQty = parseInt(editForm.qtyAllocated, 10) || 1;
    let populatedItems = [];
    let suiteSMT = null;
    let suiteMainMethod = selectedAllocForEdit.craftingMethod || 'HANDMADE';

    if (isSuite) {
      populatedItems = (editForm.items || []).map(it => {
        const d = (designs || []).find(x => x.code === it.designCode);
        const itemQty = parseInt(it.qty, 10) || 1;
        const unit = d ? d.totalSMT : 60;
        return {
          designCode: it.designCode,
          designName: d?.name || it.designCode,
          qty: itemQty,
          unitSMT: unit,
          totalSMT: parseFloat((unit * itemQty).toFixed(1)),
          metalType: it.metalType || editForm.metalType || 'Gold 22K',
          craftingMethod: it.craftingMethod || 'HANDMADE'
        };
      });
      finalQty = populatedItems.reduce((sum, it) => sum + it.qty, 0);
      suiteSMT = populatedItems.reduce((sum, it) => sum + it.totalSMT, 0);
      const uniqueMethods = [...new Set(populatedItems.map(it => it.craftingMethod))];
      suiteMainMethod = uniqueMethods.length === 1 ? uniqueMethods[0] : 'MIXED';
    }

    const calcBudgetedSMT = isSuite 
      ? parseFloat(suiteSMT.toFixed(1)) 
      : (() => {
          const d = (designs || []).find(x => x.code === editForm.designCode);
          return d ? parseFloat((d.totalSMT * finalQty).toFixed(1)) : (selectedAllocForEdit.budgetedSMT || 60);
        })();

    onUpdateAllocation(targetId, {
      ...selectedAllocForEdit,
      ...editForm,
      isSuite,
      suiteName: isSuite ? (editForm.suiteName || 'Jewellery Suite / Set') : null,
      items: isSuite ? populatedItems : [],
      craftingMethod: isSuite ? suiteMainMethod : (selectedAllocForEdit.craftingMethod || 'HANDMADE'),
      designCode: isSuite ? (populatedItems[0]?.designCode || 'SUITE-SET') : editForm.designCode,
      designName: isSuite ? (editForm.suiteName || 'Jewellery Suite / Set') : selectedAllocForEdit.designName,
      status: editForm.status || (editForm.actualHours !== '' ? 'Completed' : 'In Progress'),
      metalType: editForm.metalType || 'Gold 22K',
      qtyAllocated: finalQty,
      budgetedSMT: calcBudgetedSMT,
      assumedHours: parseFloat(editForm.assumedHours) || (calcBudgetedSMT ? parseFloat((calcBudgetedSMT / 60).toFixed(2)) : 8.0),
      actualHours: editForm.actualHours !== '' ? parseFloat(editForm.actualHours) : null,
      goldIssuedGrams: editForm.goldIssuedGrams !== '' ? parseFloat(editForm.goldIssuedGrams) : null,
      goldReturnedGrams: editForm.goldReturnedGrams !== '' ? parseFloat(editForm.goldReturnedGrams) : null
    });

    setShowEditModal(false);
    setSelectedAllocForEdit(null);
  };

  const handleDelete = () => {
    if (!selectedAllocForEdit || !onDeleteAllocation) return;
    if (window.confirm(`Are you sure you want to permanently delete order ${selectedAllocForEdit.workOrder || selectedAllocForEdit.id}?`)) {
      onDeleteAllocation(selectedAllocForEdit.id);
      setShowEditModal(false);
      setSelectedAllocForEdit(null);
    }
  };

  const handleOpenCarryModal = (alloc) => {
    setCarryAlloc(alloc);
    const today = alloc.date || new Date().toISOString().split('T')[0];
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    const tomorrowStr = d.toISOString().split('T')[0];
    
    setCarryNextDate(tomorrowStr);
    const assumed = alloc.assumedHours || 8.0;
    const todayH = Math.min(8.0, assumed);
    setCarryTodayHours(String(todayH));
    setCarryRemainingHours(String(Math.max(1.0, parseFloat((assumed - todayH).toFixed(1)) || 4.0)));
    setCarryTodayCompletedQty(Math.floor((alloc.qtyAllocated || 1) / 2));
    setCarryVaultGrams(alloc.goldIssuedGrams ? String(alloc.goldIssuedGrams) : '');
    setShowCarryModal(true);
  };

  const handleQuickCreateShop = async () => {
    if (!quickShopName.trim()) {
      alert('Please enter a shop name.');
      return;
    }
    setIsSubmittingShop(true);
    try {
      if (onAddClientShop) {
        const created = await onAddClientShop({
          name: quickShopName.trim(),
          location: quickShopLocation.trim() || 'Colombo',
          agreedLossPct: parseFloat(quickShopLossPct) || 3.5
        });
        if (created) {
          setChannelName(`${created.name} (${created.location})`);
          setWorkOrder(`WO-EXT-${created.id.replace('SHOP-', '')}-${Date.now().toString().slice(-4)}`);
        }
      }
      setQuickShopName('');
      setQuickShopLocation('');
      setShowQuickAddShop(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create shop.');
    } finally {
      setIsSubmittingShop(false);
    }
  };

  const handleCreateFullShop = async (e) => {
    e.preventDefault();
    if (!newShopForm.name.trim()) return;
    setIsSubmittingShop(true);
    try {
      if (onAddClientShop) {
        await onAddClientShop({
          ...newShopForm,
          agreedLossPct: parseFloat(newShopForm.agreedLossPct) || 3.5
        });
      }
      setNewShopForm({
        name: '',
        location: '',
        contactPerson: '',
        phone: '',
        agreedLossPct: '3.5',
        billingModel: 'Contract SMT + 3.5% Loss',
        notes: ''
      });
      alert('External Client Shop successfully registered!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to register shop.');
    } finally {
      setIsSubmittingShop(false);
    }
  };

  const handleConfirmCarryOver = (e) => {
    e.preventDefault();
    if (!carryAlloc) return;

    const todayHoursNum = parseFloat(carryTodayHours) || 8.0;
    const remainingHoursNum = parseFloat(carryRemainingHours) || 4.0;
    const vaultGramsNum = carryVaultGrams ? parseFloat(carryVaultGrams) : null;
    const completedQtyNum = parseInt(carryTodayCompletedQty, 10) || 0;
    const remainingQty = Math.max(1, (carryAlloc.qtyAllocated || 1) - completedQtyNum);

    if (onUpdateAllocation) {
      onUpdateAllocation(carryAlloc.id, {
        ...carryAlloc,
        actualHours: todayHoursNum,
        qtyAllocated: completedQtyNum > 0 ? completedQtyNum : carryAlloc.qtyAllocated,
        goldReturnedGrams: vaultGramsNum,
        status: 'Day 1 WIP (Vault Stored)'
      });
    }

    if (onAddAllocation) {
      onAddAllocation({
        craftsmanId: carryAlloc.craftsmanId,
        designCode: carryAlloc.designCode,
        metalType: carryAlloc.metalType || 'Gold 22K',
        qtyAllocated: remainingQty,
        assumedHours: remainingHoursNum,
        actualHours: null,
        goldIssuedGrams: vaultGramsNum,
        goldReturnedGrams: null,
        channel: carryAlloc.channel,
        channelName: carryAlloc.channelName,
        workOrder: `${carryAlloc.workOrder}-DAY2`,
        date: carryNextDate
      });
    }

    setShowCarryModal(false);
    setCarryAlloc(null);
  };

  const handleClearAll = () => {
    if (!onClearAllAllocations) return;
    if (window.confirm(`⚠️ CLEAR ALL ORDERS?\n\nThis will remove all ${allocations.length} sample/past orders so you can start 100% fresh with your real factory production records.\n\nCraftsmen and Designs will NOT be deleted.\n\nDo you want to proceed?`)) {
      onClearAllAllocations();
    }
  };

  const getChannelBadge = (ch) => {
    switch (ch) {
      case 'EXTERNAL_SHOP':
        return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fef08a', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>External Shop</span>;
      case 'OWN_SHOWROOM':
        return <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>Own Showroom</span>;
      case 'FACTORY_STOCK':
        return <span style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.4)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>Factory Stock</span>;
      case 'OWNER_SPECIAL':
        return <span style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#e9d5ff', border: '1px solid rgba(168, 85, 247, 0.5)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>👑 Owner VIP</span>;
      default:
        return <span style={{ color: '#94a3b8' }}>—</span>;
    }
  };

  const getMetalBadge = (metal, code) => {
    const m = metal || (code && code.startsWith('PLT-') ? 'Platinum 950' : code && code.startsWith('SLV-') ? 'Silver 925' : 'Gold 22K');
    const lower = m.toLowerCase();

    if (lower.includes('platinum') || lower.includes('plt')) {
      return (
        <span style={{ background: 'rgba(56, 189, 248, 0.18)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>💎</span> {m.replace('Platinum', 'PLT')}
        </span>
      );
    }
    if (lower.includes('palladium') || lower.includes('pd')) {
      return (
        <span style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', border: '1px solid rgba(14, 165, 233, 0.45)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>🔷</span> {m.replace('Palladium', 'PD')}
        </span>
      );
    }
    if (lower.includes('silver') || lower.includes('slv') || lower.includes('925') || lower.includes('999')) {
      return (
        <span style={{ background: 'rgba(203, 213, 225, 0.18)', color: '#e2e8f0', border: '1px solid rgba(203, 213, 225, 0.4)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>⚪</span> {m.replace('Silver ', 'SLV ')}
        </span>
      );
    }
    if (lower.includes('rose') || lower.includes('pink')) {
      return (
        <span style={{ background: 'rgba(244, 114, 182, 0.18)', color: '#fbcfe8', border: '1px solid rgba(244, 114, 182, 0.4)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>🌸</span> {m.replace('Gold ', '')}
        </span>
      );
    }
    if (lower.includes('white')) {
      return (
        <span style={{ background: 'rgba(186, 230, 253, 0.2)', color: '#bae6fd', border: '1px solid rgba(186, 230, 253, 0.45)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>❄️</span> {m.replace('Gold ', '')}
        </span>
      );
    }
    if (lower.includes('14k')) {
      return (
        <span style={{ background: 'rgba(250, 204, 21, 0.18)', color: '#fde047', border: '1px solid rgba(250, 204, 21, 0.4)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>🟡</span> 14K Gold
        </span>
      );
    }
    if (lower.includes('9k')) {
      return (
        <span style={{ background: 'rgba(253, 224, 71, 0.15)', color: '#fef08a', border: '1px solid rgba(253, 224, 71, 0.35)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>🟡</span> 9K Gold
        </span>
      );
    }
    if (lower.includes('24k') || lower.includes('pure')) {
      return (
        <span style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.25) 100%)', color: '#fef08a', border: '1px solid #d4af37', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '900', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>👑</span> 24K Pure
        </span>
      );
    }
    if (lower.includes('brass') || lower.includes('bronze') || lower.includes('copper')) {
      return (
        <span style={{ background: 'rgba(251, 146, 60, 0.18)', color: '#fdba74', border: '1px solid rgba(251, 146, 60, 0.4)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          <span>🥉</span> {m}
        </span>
      );
    }

    return (
      <span style={{ background: 'rgba(234, 179, 8, 0.18)', color: '#fef08a', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
        <span>🟡</span> {m.replace('Gold ', '') || '22K'}
      </span>
    );
  };

  return (
    <div>
      <div className="executive-header">
        <div>
          <h1 className="executive-title">
            <Calendar size={24} color="#d4af37" />
            <span>Order Dispatch & Assumed vs Actual Hours Tracker</span>
          </h1>
          <p className="executive-subtitle">
            Budget <strong>Assumed (Est.) Hours</strong> before order dispatch, and record <strong>Actual Hours Taken</strong> upon completion. <strong>Click Edit on any order to replace sample data with your real factory figures.</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {allocations && allocations.length > 0 && (
            <button 
              className="btn-ghost-secondary" 
              onClick={handleClearAll}
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.1)' }}
              title="Delete sample past data to enter 100% real factory orders"
            >
              <Trash2 size={15} color="#f87171" />
              <span>Clear Sample Orders</span>
            </button>
          )}
          <button 
            className="btn-ghost-secondary" 
            onClick={() => setShowShopsModal(true)}
            style={{ borderColor: 'rgba(56, 189, 248, 0.5)', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)' }}
            title="View, register, and manage external B2B retail jeweller client shops"
          >
            <Store size={15} color="#38bdf8" />
            <span>🏪 External Client Shops ({clientShops.length})</span>
          </button>
          <button 
            className="btn-ghost-secondary" 
            onClick={() => setShowBatchPrintModal(true)}
            style={{ borderColor: 'rgba(52, 211, 153, 0.5)', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)' }}
            title="Batch print all dispatched bench QR slips (4 per A4 sheet with cut lines)"
          >
            <Printer size={15} color="#34d399" />
            <span>🖨️ Batch Print Slips (4 / A4)</span>
          </button>
          <button 
            className="btn-ghost-secondary btn-fast-worksheet" 
            onClick={() => setShowBatchModal(true)}
            style={{ borderColor: '#d4af37', color: '#fef08a', background: 'rgba(212, 175, 55, 0.15)' }}
            title="Fast spreadsheet entry for all 63 benches at once"
          >
            <Zap size={16} color="#d4af37" />
            <span>⚡ Fast 63-Bench Batch Worksheet</span>
          </button>
          <button 
            className="btn-gold-primary" 
            onClick={() => {
              if (!craftsmanId && craftsmen && craftsmen.length > 0) setCraftsmanId(craftsmen[0].id);
              if (!designCode && designs && designs.length > 0) setDesignCode(designs[0].code);
              setWorkOrder(`WO-${channel.slice(0, 3)}-${Date.now().toString().slice(-4)}`);
              setCustomAssumedHours('');
              setDispatchActualHours('');
              setShowModal(true);
            }}
          >
            <Plus size={16} />
            <span>Single Order</span>
          </button>
        </div>
      </div>

      {/* View Mode Navigation Tabs: Live Floor Monitor vs Ledger */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        borderRadius: '10px',
        padding: '6px 10px',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('LIVE_MONITOR')}
            style={{
              background: viewMode === 'LIVE_MONITOR' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)' : 'transparent',
              border: viewMode === 'LIVE_MONITOR' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
              color: viewMode === 'LIVE_MONITOR' ? '#fca5a5' : '#94a3b8',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }}></span>
            <span>🔴 Live Floor Monitor & ETA Board</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('LEDGER')}
            style={{
              background: viewMode === 'LEDGER' ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(180, 130, 20, 0.15) 100%)' : 'transparent',
              border: viewMode === 'LEDGER' ? '1px solid #d4af37' : '1px solid rgba(255, 255, 255, 0.1)',
              color: viewMode === 'LEDGER' ? '#fef08a' : '#94a3b8',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={14} color="#d4af37" />
            <span>📋 Dispatch & Variance Ledger</span>
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="#38bdf8" />
          <span>Real-time shop floor execution with dynamic SMT finish predictions & break auto-pausing</span>
        </div>
      </div>

      {viewMode === 'LIVE_MONITOR' ? (
        <LiveFloorMonitor 
          allocations={allocations}
          craftsmen={craftsmen}
          designs={designs}
          leaves={leaves}
          clientShops={clientShops}
          targetDate={targetDate}
          onUpdateAllocation={onUpdateAllocation}
          onAddAllocation={onAddAllocation}
          onOpenEditModal={handleOpenEditModal}
          onOpenCarryModal={handleOpenCarryModal}
        />
      ) : (
        <>
      {/* Search and Quick Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text"
            style={{ width: '100%', paddingLeft: '36px', height: '36px', fontSize: '12px' }}
            placeholder="Search past orders (by WO #, craftsman name, bench ID, client)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Month:</span>
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: '2026-11', label: 'November 2026' },
            { id: '2026-10', label: 'October 2026' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMonthFilter(m.id)}
              className="btn-ghost-secondary"
              style={{
                borderColor: monthFilter === m.id ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
                color: monthFilter === m.id ? '#fef08a' : '#cbd5e1',
                background: monthFilter === m.id ? 'rgba(212, 175, 55, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                padding: '5px 12px',
                fontSize: '12px'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Metals' },
            { id: '22K_24K', label: '🟡 22K/24K Gold' },
            { id: '18K', label: '✨ 18K Gold' },
            { id: '14K_9K', label: '🌟 14K/9K Gold' },
            { id: 'PLATINUM', label: '💎 Plat / PD' },
            { id: 'SILVER', label: '⚪ Silver' },
            { id: 'OTHER', label: '⚙️ Other Alloys' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMetalFilter(m.id)}
              className="btn-ghost-secondary"
              style={{
                borderColor: metalFilter === m.id ? '#d4af37' : 'rgba(255, 255, 255, 0.08)',
                color: metalFilter === m.id ? '#fef08a' : '#94a3b8',
                background: metalFilter === m.id ? 'rgba(212, 175, 55, 0.22)' : 'transparent',
                padding: '4px 9px',
                fontSize: '11px',
                fontWeight: metalFilter === m.id ? 'bold' : 'normal'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Channels' },
            { id: 'EXTERNAL_SHOP', label: 'External (B2B)' },
            { id: 'OWN_SHOWROOM', label: 'Showrooms' },
            { id: 'FACTORY_STOCK', label: 'Factory Stock' },
            { id: 'OWNER_SPECIAL', label: 'Owner VIP' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setChannelFilter(tab.id)}
              className="btn-ghost-secondary"
              style={{
                borderColor: channelFilter === tab.id ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                color: channelFilter === tab.id ? '#38bdf8' : '#94a3b8',
                background: channelFilter === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                padding: '4px 10px',
                fontSize: '11px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Item Note Banner */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
        color: '#bae6fd'
      }}>
        <Sparkles size={16} color="#38bdf8" />
        <span>
          <strong>Multi-Item Work Dispatch:</strong> Craftsmen can work on multiple jewellery items per day (e.g. 4 rings in the morning + 2 bangles in the afternoon). Click <strong>"+ Item"</strong> on any row or <strong>"+ Single Order"</strong> to add secondary job tickets. All hours and scrap for each craftsman are automatically combined in the monthly reports!
        </span>
      </div>

      <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
        Showing <strong>{filteredAllocations.length}</strong> orders • {monthFilter === '2026-10' ? 'Displaying October 2026' : monthFilter === '2026-11' ? 'Displaying November 2026' : 'Displaying All Months'}
      </div>

      {/* Allocations Table */}
      <div className="table-luxury-wrap">
        <table className="table-luxury">
          <thead>
            <tr>
              <th>Date</th>
              <th>Alloc ID</th>
              <th>Order Channel</th>
              <th>Client / Destination</th>
              <th>Craftsman Bench</th>
              <th>Work Order #</th>
              <th>Design Code</th>
              <th>Qty</th>
              <th>Assumed (Est.) Hrs</th>
              <th>Actual Hours Taken</th>
              <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }} title="Craftsman Actual Daily Break Time (Standard Shift Allowance = 2.0h / 120m)">☕ Break Time</th>
              <th>Hours Variance (+/-)</th>
              <th>Scrap Loss %</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAllocations.map((a) => {
              const assumed = a.assumedHours || parseFloat((a.budgetedSMT / 60).toFixed(2));
              const hasActual = a.actualHours !== null && a.actualHours !== undefined;
              const actual = hasActual ? a.actualHours : null;
              const variance = hasActual ? parseFloat((actual - assumed).toFixed(2)) : null;
              const variancePct = hasActual && assumed > 0 ? parseFloat(((variance / assumed) * 100).toFixed(1)) : null;

              return (
                <tr key={a.id}>
                  <td><strong>{a.date}</strong></td>
                  <td><strong style={{ color: 'var(--gold-primary)' }}>{a.id}</strong></td>
                  <td>{getChannelBadge(a.channel)}</td>
                  <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{a.channelName}</td>
                  <td>
                    <strong style={{ color: 'var(--gold-primary)' }}>{a.craftsmanId}</strong> — {(craftsmen || []).find(c => c.id === a.craftsmanId)?.name || a.craftsmanName}
                  </td>
                  <td><code style={{ background: 'var(--code-bg, rgba(10, 15, 29, 0.8))', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>{a.workOrder}</code></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {(() => {
                        const targetD = (designs || []).find(d => d.code === a.designCode);
                        return (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            background: '#0a0f1d',
                            flexShrink: 0
                          }}>
                            <img 
                              src={getDesignDisplayImage(targetD || { code: a.designCode, metalType: a.metalType })}
                              alt={a.designCode}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getLuxuryJewellerySvg('Ring', a.metalType);
                              }}
                            />
                          </div>
                        );
                      })()}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                        {a.isSuite ? (
                          <>
                            <span style={{ 
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
                              color: 'var(--gold-primary)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              👑 {a.suiteName || 'Suite / Set'} ({a.qtyAllocated || (a.items ? a.items.reduce((s, i) => s + (i.qty || 1), 0) : 1)} pcs)
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                              {a.items && a.items.length > 0 ? a.items.map((it, i) => {
                                const itRoute = getCraftingMethodInfo(it.craftingMethod || a.craftingMethod);
                                return (
                                  <span key={i} style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span>{it.qty}x <strong>{it.designCode}</strong></span>
                                    <span style={{
                                      padding: '0px 4px',
                                      borderRadius: '3px',
                                      fontSize: '9px',
                                      fontWeight: 'bold',
                                      color: itRoute.color,
                                      background: itRoute.bg,
                                      border: `1px solid ${itRoute.border}`
                                    }}>
                                      {itRoute.shortLabel}
                                    </span>
                                  </span>
                                );
                              }) : (
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{a.designCode}</span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{a.designCode}</span>
                        )}
                        {getMetalBadge(a.metalType, a.designCode)}
                        {!a.isSuite && (() => {
                          const rInfo = getCraftingMethodInfo(a.craftingMethod);
                          return (
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '3px',
                              fontSize: '9.5px',
                              fontWeight: 'bold',
                              color: rInfo.color,
                              background: rInfo.bg,
                              border: `1px solid ${rInfo.border}`,
                              marginTop: '2px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              {rInfo.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {a.qtyAllocated}
                    {a.isSuite && <span style={{ fontSize: '10px', color: '#fbbf24', display: 'block' }}>Set</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    {assumed} hrs
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {hasActual ? (
                      <span style={{ color: 'var(--gold-primary)' }}>{actual} hrs</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '12px' }}>In Progress</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {(() => {
                      if (!hasActual) {
                        return <span style={{ color: '#64748b' }}>—</span>;
                      }
                      const cIndex = (craftsmen || []).findIndex(c => c.id === a.craftsmanId);
                      const idxSeed = cIndex >= 0 ? cIndex : (parseInt((a.craftsmanId || '').replace(/\D/g, ''), 10) || 1);
                      let bHours = a.breakHours !== null && a.breakHours !== undefined && a.breakHours !== ''
                        ? parseFloat(a.breakHours)
                        : (a.breakMin ? parseFloat((a.breakMin / 60).toFixed(2)) : null);

                      if (bHours === null) {
                        const pseudoMin = 108 + ((idxSeed * 17) % 25);
                        bHours = parseFloat((pseudoMin / 60).toFixed(2));
                      }
                      const bMins = Math.round(bHours * 60);
                      return (
                        <span title={`Craftsman Daily Break: ${bHours.toFixed(2)} hrs (${bMins}m) • Factory Standard = 2.0h (120m)`}>
                          <span style={{ color: bHours > 2.05 ? '#fbbf24' : '#67e8f9', fontWeight: '700' }}>
                            {bHours.toFixed(2)}h
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '3px' }}>
                            ({bMins}m)
                          </span>
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {hasActual ? (
                      <span style={{ 
                        background: variance > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                        color: variance > 0 ? '#fca5a5' : '#34d399',
                        border: `1px solid ${variance > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        {variance > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {variance > 0 ? `+${variance}h (+${variancePct}%)` : `${variance}h (${variancePct}%)`}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {(() => {
                      const m = a.metalType || (a.designCode && a.designCode.startsWith('PLT-') ? 'Platinum 950' : a.designCode && a.designCode.startsWith('SLV-') ? 'Silver 925' : 'Gold 22K');
                      const ceiling = getMetalScrapCeiling(m);
                      const isAlert = a.goldLossPct && a.goldLossPct > ceiling;
                      if (!a.goldLossPct) return <span style={{ color: '#94a3b8' }}>—</span>;
                      return (
                        <span style={{
                          color: isAlert ? '#f87171' : '#34d399',
                          background: isAlert ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.12)',
                          border: `1px solid ${isAlert ? 'rgba(239, 68, 68, 0.35)' : 'rgba(52, 211, 153, 0.25)'}`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          {a.goldLossPct}% {isAlert ? '⚠️' : '✓'}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      color: a.status === 'Completed' ? '#34d399' : '#fcd34d',
                      fontWeight: 'bold',
                      fontSize: '12px' 
                    }}>
                      {a.status === 'Completed' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleOpenEditModal(a)}
                        className="btn-ghost-secondary"
                        style={{ padding: '4px 7px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px', borderColor: '#d4af37', color: '#fef08a' }}
                        title="Edit any detail or replace with real factory values"
                      >
                        <Edit3 size={11} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => {
                          setCraftsmanId(a.craftsmanId);
                          setDesignCode(a.designCode || (designs && designs[0] ? designs[0].code : 'RNG-SMP-01'));
                          setMetalType(a.metalType || 'Gold 22K');
                          setDispatchDate(a.date || new Date().toISOString().split('T')[0]);
                          setChannel(a.channel || 'OWN_SHOWROOM');
                          setChannelName(a.channelName || 'Ashadi Branch Showroom');
                          setQty(2);
                          setWorkOrder(`WO-${(a.channel || 'OWN').slice(0, 3)}-${Date.now().toString().slice(-4)}`);
                          setCustomAssumedHours('');
                          setDispatchActualHours('');
                          setShowModal(true);
                        }}
                        className="btn-ghost-secondary"
                        style={{ padding: '4px 7px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '2px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                        title="Add 2nd or 3rd job ticket for this craftsman on the same date"
                      >
                        <Plus size={11} />
                        <span>+ Item</span>
                      </button>

                      {a.status !== 'Completed' && (
                        <button
                          onClick={() => handleOpenCarryModal(a)}
                          className="btn-ghost-secondary"
                          style={{ padding: '4px 7px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '2px', borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fef08a', background: 'rgba(245, 158, 11, 0.12)' }}
                          title="Carry forward incomplete order to next shift with overnight safe vault check-in"
                        >
                          <ArrowRight size={11} color="#f59e0b" />
                          <span>Carry-Over</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* Printable Bench QR Slip Modal */}
      {printingSlipOrder && (
        <PrintableJobSlipModal
          isOpen={!!printingSlipOrder}
          onClose={() => setPrintingSlipOrder(null)}
          order={printingSlipOrder}
          designs={designs}
        />
      )}

      {/* Modal 1: Dispatch Single Order */}
      {showModal && (
        <div className="modal-backdrop-luxury" onClick={() => setShowModal(false)}>
          <div className="modal-window-luxury" style={{ maxWidth: '750px', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '19px', fontFamily: 'var(--font-serif)' }}>
                Dispatch / Record Work Order
              </h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="btn-ghost-secondary"
                style={{ padding: '5px 12px', fontSize: '12px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}
              >
                ✕ Close
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    📅 Date & Bench Start Time
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="date" 
                      required
                      style={{ flex: 1, fontWeight: 'bold', color: '#fef08a' }}
                      value={dispatchDate} 
                      onChange={(e) => setDispatchDate(e.target.value)} 
                    />
                    <input 
                      type="time" 
                      style={{ width: '110px', fontWeight: 'bold', color: '#38bdf8' }}
                      value={dispatchTime} 
                      onChange={(e) => setDispatchTime(e.target.value)} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Order Origin / Channel
                  </label>
                  <select 
                    style={{ width: '100%' }} 
                    value={channel} 
                    onChange={(e) => {
                      setChannel(e.target.value);
                      if (e.target.value === 'EXTERNAL_SHOP') setChannelName('Swarna Jewellers (Pettah)');
                      if (e.target.value === 'OWN_SHOWROOM') setChannelName('Ashadi Main Branch (Kaduwela)');
                      if (e.target.value === 'FACTORY_STOCK') setChannelName('Central Factory Finished Goods Stock');
                      if (e.target.value === 'OWNER_SPECIAL') setChannelName('Chairman / Owner Private VIP Commission');
                    }}
                  >
                    <option value="EXTERNAL_SHOP">External Jeweller Shop (B2B Contract)</option>
                    <option value="OWN_SHOWROOM">Ashadi Branch Showrooms (Internal)</option>
                    <option value="FACTORY_STOCK">Central Factory Buffer Stock</option>
                    <option value="OWNER_SPECIAL">Owner & VIP Private Orders</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', margin: 0 }}>
                      {channel === 'EXTERNAL_SHOP' ? 'Partner Retail Jeweller Shop' : 'Client / Destination Name'}
                    </label>
                    {channel === 'EXTERNAL_SHOP' && (
                      <button
                        type="button"
                        onClick={() => setShowQuickAddShop(!showQuickAddShop)}
                        style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <Plus size={12} />
                        <span>{showQuickAddShop ? 'Cancel' : '+ New Shop'}</span>
                      </button>
                    )}
                  </div>

                  {channel === 'EXTERNAL_SHOP' ? (
                    <div>
                      <select 
                        style={{ width: '100%', fontWeight: 'bold', color: '#fef08a' }}
                        value={channelName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setChannelName(val);
                          const shop = clientShops.find(s => s.name === val || `${s.name} (${s.location})` === val);
                          if (shop) {
                            setWorkOrder(`WO-EXT-${shop.id.replace('SHOP-', '')}-${Date.now().toString().slice(-4)}`);
                          }
                        }}
                      >
                        <option value="">-- Select Registered External Shop --</option>
                        {clientShops.map(s => (
                          <option key={s.id} value={`${s.name} (${s.location})`}>
                            {s.name} — {s.location} (Loss: {s.agreedLossPct}%)
                          </option>
                        ))}
                      </select>

                      {showQuickAddShop && (
                        <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '10px 12px', marginTop: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px' }}>
                            Fast Add New External Client Shop:
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                            <input 
                              type="text" 
                              placeholder="Shop Name (e.g. Devi Jewellers)" 
                              value={quickShopName}
                              onChange={(e) => setQuickShopName(e.target.value)}
                              style={{ fontSize: '12px' }}
                            />
                            <input 
                              type="text" 
                              placeholder="Location (e.g. Sea Street, Pettah)" 
                              value={quickShopLocation}
                              onChange={(e) => setQuickShopLocation(e.target.value)}
                              style={{ fontSize: '12px' }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Default agreed scrap allowance: <strong>3.5%</strong>
                            </span>
                            <button
                              type="button"
                              className="btn-gold-primary"
                              style={{ fontSize: '11px', padding: '3px 10px' }}
                              onClick={handleQuickCreateShop}
                              disabled={isSubmittingShop}
                            >
                              {isSubmittingShop ? 'Saving...' : 'Save & Select'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : channel === 'OWN_SHOWROOM' ? (
                    <div>
                      <input 
                        type="text" 
                        list="showroom-branches-list"
                        style={{ width: '100%', color: '#93c5fd', fontWeight: 'bold' }}
                        value={channelName} 
                        onChange={(e) => setChannelName(e.target.value)} 
                        placeholder="e.g. Ashadi Main Branch (Kaduwela)"
                      />
                      <datalist id="showroom-branches-list">
                        <option value="Ashadi Main Branch (Kaduwela)" />
                        <option value="Ashadi Branch (Galle)" />
                        <option value="Ashadi Branch (Negombo)" />
                      </datalist>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '5px' }}>
                        {[
                          { label: 'Kaduwela (Main Branch)', val: 'Ashadi Main Branch (Kaduwela)' },
                          { label: 'Galle', val: 'Ashadi Branch (Galle)' },
                          { label: 'Negombo', val: 'Ashadi Branch (Negombo)' }
                        ].map(b => (
                          <button
                            key={b.label}
                            type="button"
                            onClick={() => setChannelName(b.val)}
                            style={{
                              background: channelName === b.val ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                              border: channelName === b.val ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                              color: channelName === b.val ? '#38bdf8' : '#94a3b8',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              fontWeight: channelName === b.val ? 'bold' : 'normal'
                            }}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      style={{ width: '100%' }}
                      value={channelName} 
                      onChange={(e) => setChannelName(e.target.value)} 
                      placeholder="e.g. Central Factory Finished Goods Stock"
                    />
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Work Order #
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={workOrder} 
                    onChange={(e) => setWorkOrder(e.target.value)} 
                    placeholder="e.g. WO-OCT-2610-09"
                  />
                </div>
              </div>

              {/* Craftsman & Base Metal Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Select Craftsman (63 Benches)
                  </label>
                  <select 
                    style={{ width: '100%' }} 
                    value={craftsmanId} 
                    onChange={(e) => setCraftsmanId(e.target.value)}
                  >
                    {(craftsmen || []).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.name} ({c.skillTier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', margin: 0 }}>
                      Precious Metal / Karat
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomMetalDispatch(!isCustomMetalDispatch)}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {isCustomMetalDispatch ? 'Use Dropdown' : '+ Custom Metal...'}
                    </button>
                  </div>

                  {isCustomMetalDispatch ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text"
                        placeholder="e.g. Gold 14K Rose, Titanium, Pd 500"
                        style={{ flex: 1, fontWeight: 'bold', color: '#38bdf8' }}
                        value={customMetalInput}
                        onChange={(e) => setCustomMetalInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-gold-primary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => {
                          if (customMetalInput.trim()) {
                            const val = customMetalInput.trim();
                            setMetalType(val);
                            if (!customMetalsList.includes(val)) setCustomMetalsList(prev => [...prev, val]);
                            setIsCustomMetalDispatch(false);
                            setCustomMetalInput('');
                          }
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <select 
                      style={{ width: '100%', fontWeight: 'bold', color: '#fef08a' }} 
                      value={metalType} 
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomMetalDispatch(true);
                        } else {
                          setMetalType(e.target.value);
                        }
                      }}
                    >
                      <optgroup label="🟡 High Karat Traditional Gold">
                        <option value="Gold 24K">Gold 24K (Pure 999.9 Bullion • Ceiling 3.2%)</option>
                        <option value="Gold 22K">Gold 22K (Standard 916 Sovereign • Ceiling 3.5%)</option>
                      </optgroup>
                      <optgroup label="✨ 18K Commercial Gold (Gem & Bridal)">
                        <option value="Gold 18K Yellow">Gold 18K Yellow (750 Standard • Ceiling 3.0%)</option>
                        <option value="Gold 18K White">Gold 18K White (750 Nickel/Palladium • Ceiling 3.0%)</option>
                        <option value="Gold 18K Rose">Gold 18K Rose (750 Pink Copper • Ceiling 3.0%)</option>
                      </optgroup>
                      <optgroup label="🌟 14K & 9K Gold (Export & Modern Jewellery)">
                        <option value="Gold 14K Yellow">Gold 14K Yellow (585 Export • Ceiling 2.8%)</option>
                        <option value="Gold 14K White">Gold 14K White (585 Rhodium • Ceiling 2.8%)</option>
                        <option value="Gold 14K Rose">Gold 14K Rose (585 Pink • Ceiling 2.8%)</option>
                        <option value="Gold 9K">Gold 9K (375 British Standard • Ceiling 2.5%)</option>
                      </optgroup>
                      <optgroup label="💎 Platinum & Palladium (High-End Master Grade)">
                        <option value="Platinum 950">Platinum 950 (High-Purity 1768°C • Ceiling 1.8% • Grade A)</option>
                        <option value="Platinum 900">Platinum 900 (10% Iridium • Ceiling 1.8% • Grade A)</option>
                        <option value="Palladium 950">Palladium 950 (Hypoallergenic Luxury • Ceiling 1.8%)</option>
                      </optgroup>
                      <optgroup label="⚪ Silver Alloys">
                        <option value="Silver 925">Silver 925 (Sterling Silver • Ceiling 5.5%)</option>
                        <option value="Silver 999">Silver 999 (Fine Pure Silver • Ceiling 5.0%)</option>
                      </optgroup>
                      <optgroup label="🥉 Base & Prototype Metals">
                        <option value="Brass / Bronze">Brass / Bronze (Master Model Prototype • Ceiling 6.0%)</option>
                        <option value="Copper">Copper (Forming Sheet / Blank • Ceiling 6.0%)</option>
                      </optgroup>
                      {customMetalsList.filter(m => !STANDARD_METALS.some(sm => sm.id === m)).length > 0 && (
                        <optgroup label="⚙️ Custom Registered Metals">
                          {customMetalsList.filter(m => !STANDARD_METALS.some(sm => sm.id === m)).map(m => (
                            <option key={m} value={m}>{m} (Custom Alloy)</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__CUSTOM__">+ Custom Metal / Other Alloy...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Order Type Toggle: Single Design vs Multi-Item Suite / Set */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                marginBottom: '14px',
                display: 'flex',
                gap: '8px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsSuiteDispatch(false)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: !isSuiteDispatch ? 'linear-gradient(135deg, #d4af37, #b8860b)' : 'transparent',
                    color: !isSuiteDispatch ? '#000' : '#94a3b8',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>💎</span> Single Jewellery Design (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setIsSuiteDispatch(true)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isSuiteDispatch ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                    color: isSuiteDispatch ? '#000' : '#94a3b8',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>👑</span> Multi-Item Suite / Set (Bridal / Combo)
                </button>
              </div>

              {/* Single Design Inputs */}
              {!isSuiteDispatch ? (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.15fr 0.75fr', gap: '10px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                        Jewellery Design
                      </label>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <select 
                          style={{ flex: 1, minWidth: 0, fontSize: '12px' }} 
                          value={designCode} 
                          onChange={(e) => {
                            const code = e.target.value;
                            setDesignCode(code);
                            const d = (designs || []).find(item => item.code === code);
                            if (d && d.metalType) setMetalType(d.metalType);
                            if (d && d.craftingMethod) setCraftingMethodDispatch(d.craftingMethod);
                          }}
                        >
                          {(designs || []).map(d => (
                            <option key={d.code} value={d.code}>
                              {d.code} - {d.name} ({d.metalType || 'Gold 22K'}, {d.totalSMT}m)
                            </option>
                          ))}
                        </select>

                        {/* Browse Camera Button */}
                        <button
                          type="button"
                          onClick={() => setVisualPickerState({
                            isOpen: true,
                            mode: 'SINGLE_DISPATCH',
                            itemIdx: null,
                            craftsman: selectedCraftsman,
                            currentDesignCode: designCode
                          })}
                          style={{
                            padding: '7px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(180, 83, 9, 0.25))',
                            border: '1px solid rgba(212, 175, 55, 0.55)',
                            color: '#fef08a',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                          title="Open Visual Photo Gallery to pick design"
                        >
                          <Camera size={13} />
                          <span>Browse</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#fef08a', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                        Manufacturing Route
                      </label>
                      <select 
                        style={{ 
                          width: '100%', 
                          fontWeight: 'bold',
                          fontSize: '12px',
                          color: craftingMethodDispatch === 'CASTING' ? '#fb923c' : craftingMethodDispatch === 'CNC_LASER' ? '#38bdf8' : '#fbbf24',
                          background: '#0a0f1d'
                        }} 
                        value={craftingMethodDispatch} 
                        onChange={(e) => setCraftingMethodDispatch(e.target.value)}
                      >
                        <option value="HANDMADE">🔨 Fully Handmade</option>
                        <option value="CASTING">🔥 Casting ➔ Bench</option>
                        <option value="CNC_LASER">⚡ CNC / Laser ➔ Bench</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px', whiteSpace: 'nowrap' }}>
                        Target Qty (Pcs)
                      </label>
                      <input 
                        type="number" 
                        min="1" 
                        max="50" 
                        style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}
                        value={qty} 
                        onChange={(e) => {
                          setQty(parseInt(e.target.value, 10) || 1);
                          setCustomAssumedHours('');
                        }} 
                      />
                    </div>
                  </div>

                  {/* Selected Single Design Visual Thumbnail Preview Bar */}
                  {selectedDesign && (
                    <div
                      onClick={() => setVisualPickerState({
                        isOpen: true,
                        mode: 'SINGLE_DISPATCH',
                        itemIdx: null,
                        craftsman: selectedCraftsman,
                        currentDesignCode: designCode
                      })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '10px',
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        cursor: 'pointer'
                      }}
                      title="Click to preview full photo & change design"
                    >
                      <img
                        src={getDesignDisplayImage(selectedDesign)}
                        alt={selectedDesign.name}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          objectFit: 'cover',
                          border: '1px solid rgba(212, 175, 55, 0.45)',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getLuxuryJewellerySvg('Ring', metalType);
                        }}
                      />
                      <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '500', flex: 1 }}>
                        {selectedDesign.code} — {selectedDesign.name}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: 'bold' }}>
                        {selectedDesign.totalSMT}m / pc
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Multi-Item Jewellery Suite Repeater (Per-Item Manufacturing Route) */
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(180, 83, 9, 0.05) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crown size={16} color="#fbbf24" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24' }}>
                        Jewellery Suite / Set Specification
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextDesign = designs && designs.length > suiteItems.length ? designs[suiteItems.length] : (designs && designs[0] ? designs[0] : null);
                        setSuiteItems(prev => [
                          ...prev,
                          {
                            designCode: nextDesign ? nextDesign.code : 'RNG-SMP-01',
                            qty: 1,
                            metalType: nextDesign?.metalType || metalType || 'Gold 22K',
                            craftingMethod: nextDesign?.craftingMethod || 'HANDMADE'
                          }
                        ]);
                      }}
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#fbbf24',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={12} /> Add Piece to Suite
                    </button>
                  </div>

                  {/* Suite Title */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                      Suite / Collection Name
                    </label>
                    <input 
                      type="text" 
                      style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#fef08a' }}
                      value={suiteName}
                      onChange={(e) => setSuiteName(e.target.value)}
                      placeholder="e.g. Royal Bridal Suite (Ring + Necklace + 2x Earrings)"
                    />
                  </div>

                  {/* Suite Items List with Browse Button, Per-Item Manufacturing Route & Thumbnail Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                    {suiteItems.map((item, idx) => {
                      const d = (designs || []).find(x => x.code === item.designCode);
                      const unitSMT = d ? d.totalSMT : 60;
                      const itemSMT = (unitSMT * (parseInt(item.qty, 10) || 1)).toFixed(1);
                      const itemMethod = item.craftingMethod || 'HANDMADE';

                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            background: 'rgba(15, 23, 42, 0.75)',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          {/* Top Row: #Index, Design Dropdown, Browse Button, Per-Item Route, Qty, SMT & Delete */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'auto minmax(140px, 1.3fr) auto 138px 66px 76px auto', 
                            gap: '6px', 
                            alignItems: 'center'
                          }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', padding: '3px 6px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '4px' }}>
                              #{idx + 1}
                            </span>

                            <select
                              style={{ width: '100%', minWidth: 0, fontSize: '11.5px', fontWeight: '600' }}
                              value={item.designCode}
                              onChange={(e) => {
                                const newCode = e.target.value;
                                const selectedD = (designs || []).find(ds => ds.code === newCode);
                                setSuiteItems(prev => prev.map((it, i) => i === idx ? {
                                  ...it,
                                  designCode: newCode,
                                  craftingMethod: selectedD?.craftingMethod || it.craftingMethod || 'HANDMADE'
                                } : it));
                              }}
                            >
                              {(designs || []).map(ds => (
                                <option key={ds.code} value={ds.code}>
                                  {ds.code} — {ds.name} ({ds.totalSMT}m)
                                </option>
                              ))}
                            </select>

                            {/* Browse Button */}
                            <button
                              type="button"
                              onClick={() => setVisualPickerState({
                                isOpen: true,
                                mode: 'SUITE_DISPATCH',
                                itemIdx: idx,
                                craftsman: selectedCraftsman,
                                currentDesignCode: item.designCode
                              })}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(180, 83, 9, 0.25))',
                                border: '1px solid rgba(212, 175, 55, 0.55)',
                                color: '#fef08a',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}
                              title="Open Visual Photo Gallery to pick design"
                            >
                              <Camera size={12} />
                              <span>Browse</span>
                            </button>

                            {/* Per-Item Manufacturing Route Selector */}
                            <select
                              style={{
                                width: '100%',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                color: itemMethod === 'CASTING' ? '#fb923c' : itemMethod === 'CNC_LASER' ? '#38bdf8' : '#fbbf24',
                                background: '#0a0f1d'
                              }}
                              value={itemMethod}
                              onChange={(e) => {
                                const newMethod = e.target.value;
                                setSuiteItems(prev => prev.map((it, i) => i === idx ? { ...it, craftingMethod: newMethod } : it));
                              }}
                              title="Manufacturing Route for this specific piece"
                            >
                              <option value="HANDMADE">🔨 Handmade</option>
                              <option value="CASTING">🔥 Casting</option>
                              <option value="CNC_LASER">⚡ CNC / Laser</option>
                            </select>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <input 
                                type="number"
                                min="1"
                                max="20"
                                value={item.qty}
                                onChange={(e) => {
                                  const newQty = parseInt(e.target.value, 10) || 1;
                                  setSuiteItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: newQty } : it));
                                }}
                                style={{ width: '44px', fontSize: '11.5px', textAlign: 'center', fontWeight: 'bold', border: '1px solid rgba(245, 158, 11, 0.45)', color: '#fef08a' }}
                              />
                              <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>pcs</span>
                            </div>

                            <div style={{ fontSize: '10.5px', color: '#38bdf8', textAlign: 'right', fontWeight: 'bold', lineHeight: '1.2' }}>
                              {itemSMT}m <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>({unitSMT}m ea)</span>
                            </div>

                            <button
                              type="button"
                              disabled={suiteItems.length <= 1}
                              onClick={() => {
                                if (suiteItems.length > 1) {
                                  setSuiteItems(prev => prev.filter((_, i) => i !== idx));
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: suiteItems.length <= 1 ? '#475569' : '#f87171',
                                cursor: suiteItems.length <= 1 ? 'not-allowed' : 'pointer',
                                padding: '2px'
                              }}
                              title="Remove this item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Bottom Row: Thumbnail Visual Preview Bar */}
                          {d && (
                            <div
                              onClick={() => setVisualPickerState({
                                isOpen: true,
                                mode: 'SUITE_DISPATCH',
                                itemIdx: idx,
                                craftsman: selectedCraftsman,
                                currentDesignCode: item.designCode
                              })}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '7px',
                                padding: '5px 10px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                cursor: 'pointer'
                              }}
                              title="Click to preview full photo & change design"
                            >
                              <img
                                src={getDesignDisplayImage(d)}
                                alt={d.name}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '4px',
                                  objectFit: 'cover',
                                  border: '1px solid rgba(212, 175, 55, 0.45)',
                                  flexShrink: 0
                                }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getLuxuryJewellerySvg('Ring', item.metalType || metalType);
                                }}
                              />
                              <span style={{ fontSize: '11.5px', color: '#e2e8f0', fontWeight: '500', flex: 1 }}>
                                {d.name}
                              </span>
                              <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 'bold' }}>
                                {d.totalSMT}m
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Suite Aggregation Summary Banner */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '11px',
                    color: '#fef08a'
                  }}>
                    <span>Total Suite Pieces: <strong>{suiteTotalQty} pcs</strong> across <strong>{suiteItems.length} design lines</strong></span>
                    <span>Combined Suite SMT: <strong style={{ color: '#fff', fontSize: '12px' }}>{suiteTotalSMT.toFixed(1)} min ({(suiteTotalSMT / 60).toFixed(1)} hrs)</strong></span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Precious Metal Issued (g)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder={`e.g. 32.50 g of ${metalType}`} 
                    style={{ width: '100%' }}
                    value={goldIssuedGrams}
                    onChange={(e) => setGoldIssuedGrams(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '6px' }}>
                    Metal Returned (g) [If Finished]
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Leave empty if in progress" 
                    style={{ width: '100%' }}
                    value={dispatchGoldReturned}
                    onChange={(e) => setDispatchGoldReturned(e.target.value)}
                  />
                </div>
              </div>

              {/* Dynamic Live ETA Preview */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(30, 58, 138, 0.15) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ color: '#7dd3fc', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color="#38bdf8" />
                    <span>Dynamic Live ETA Preview:</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '2px' }}>
                    Standard SMT: {budgetedSMT} min • Craftsman Speed: {selectedCraftsman?.skillTier || 'Grade B'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Target Completion (ETA)</div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#fef08a' }}>
                    {calculateDynamicETA(timeStringToMinutes(dispatchTime, 510), budgetedSMT, selectedCraftsman?.skillTier || 'Grade B')?.targetETATime || '05:00 PM'}
                  </div>
                </div>
              </div>

              {/* Direct Keyboard Editable Hours Box */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '14px', 
                marginBottom: '18px', 
                background: 'rgba(15, 23, 42, 0.7)', 
                padding: '12px 14px', 
                borderRadius: '8px', 
                border: '1px solid rgba(212, 175, 55, 0.3)' 
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}>
                    ⏱️ Assumed (Estimated) Hours
                  </label>
                  <input 
                    type="number" 
                    step="any" 
                    required
                    placeholder={`Suggested: ${calculatedAssumedHours} hrs`}
                    style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#93c5fd', background: '#0a0f1d' }}
                    value={customAssumedHours !== '' ? customAssumedHours : calculatedAssumedHours}
                    onChange={(e) => setCustomAssumedHours(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Enter decimal standard hours directly (e.g. 3.0, 4.5, 8.0, 10.5).
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>
                    ⌛ Actual Hours Taken (If Done)
                  </label>
                  <input 
                    type="number" 
                    step="any" 
                    placeholder="Leave empty if in progress"
                    style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#fbbf24', background: '#0a0f1d' }}
                    value={dispatchActualHours}
                    onChange={(e) => setDispatchActualHours(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Actual clock hours taken upon completion (e.g. 4.0, 9.25).
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-ghost-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold-primary">
                  Save Order Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Full Edit Order Modal (Replace with Real Factory Values) */}
      {showEditModal && selectedAllocForEdit && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '6px', color: '#fff', fontSize: '19px', fontFamily: 'var(--font-serif)' }}>
              Edit Order Details & Real Values
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              Replace sample data with your real factory figures. You can edit actual hours, assumed budget, gold grams, client names, or delete this record.
            </p>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Order Date
                  </label>
                  <input 
                    type="date" 
                    required
                    style={{ width: '100%' }}
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Work Order #
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={editForm.workOrder}
                    onChange={(e) => setEditForm({ ...editForm, workOrder: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Demand Channel
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={editForm.channel}
                    onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })}
                  >
                    <option value="EXTERNAL_SHOP">External Shop (B2B)</option>
                    <option value="OWN_SHOWROOM">Ashadi Showroom</option>
                    <option value="FACTORY_STOCK">Central Factory Stock</option>
                    <option value="OWNER_SPECIAL">👑 Owner VIP</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Client / Branch Name
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%' }}
                    value={editForm.channelName}
                    onChange={(e) => setEditForm({ ...editForm, channelName: e.target.value })}
                  />
                </div>
              </div>

              {/* Craftsman & Precious Metal Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Craftsman
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={editForm.craftsmanId}
                    onChange={(e) => setEditForm({ ...editForm, craftsmanId: e.target.value })}
                  >
                    {craftsmen.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', margin: 0 }}>
                      Precious Metal
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomMetalEdit(!isCustomMetalEdit)}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      {isCustomMetalEdit ? 'Dropdown' : '+ Custom'}
                    </button>
                  </div>

                  {isCustomMetalEdit ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text"
                        placeholder="e.g. Gold 14K, Pd 950"
                        style={{ flex: 1, fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}
                        value={customMetalEditInput}
                        onChange={(e) => setCustomMetalEditInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-gold-primary"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                        onClick={() => {
                          if (customMetalEditInput.trim()) {
                            const val = customMetalEditInput.trim();
                            setEditForm({ ...editForm, metalType: val });
                            if (!customMetalsList.includes(val)) setCustomMetalsList(prev => [...prev, val]);
                            setIsCustomMetalEdit(false);
                            setCustomMetalEditInput('');
                          }
                        }}
                      >
                        Set
                      </button>
                    </div>
                  ) : (
                    <select 
                      style={{ width: '100%', fontWeight: 'bold', color: '#fef08a', fontSize: '12px' }}
                      value={editForm.metalType}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomMetalEdit(true);
                        } else {
                          setEditForm({ ...editForm, metalType: e.target.value });
                        }
                      }}
                    >
                      <optgroup label="🟡 High Karat Gold">
                        <option value="Gold 24K">Gold 24K (Pure 999.9)</option>
                        <option value="Gold 22K">Gold 22K (Standard 916)</option>
                      </optgroup>
                      <optgroup label="✨ 18K Commercial Gold">
                        <option value="Gold 18K Yellow">Gold 18K Yellow (750)</option>
                        <option value="Gold 18K White">Gold 18K White (750)</option>
                        <option value="Gold 18K Rose">Gold 18K Rose (750)</option>
                      </optgroup>
                      <optgroup label="🌟 14K & 9K Gold">
                        <option value="Gold 14K Yellow">Gold 14K Yellow (585)</option>
                        <option value="Gold 14K White">Gold 14K White (585)</option>
                        <option value="Gold 14K Rose">Gold 14K Rose (585)</option>
                        <option value="Gold 9K">Gold 9K (375)</option>
                      </optgroup>
                      <optgroup label="💎 Platinum & Palladium">
                        <option value="Platinum 950">Platinum 950</option>
                        <option value="Platinum 900">Platinum 900</option>
                        <option value="Palladium 950">Palladium 950</option>
                      </optgroup>
                      <optgroup label="⚪ Silver Alloys">
                        <option value="Silver 925">Silver 925 (Sterling)</option>
                        <option value="Silver 999">Silver 999 (Fine)</option>
                      </optgroup>
                      <optgroup label="🥉 Base & Prototypes">
                        <option value="Brass / Bronze">Brass / Bronze</option>
                        <option value="Copper">Copper</option>
                      </optgroup>
                      {customMetalsList.filter(m => !STANDARD_METALS.some(sm => sm.id === m)).length > 0 && (
                        <optgroup label="⚙️ Custom Registered Metals">
                          {customMetalsList.filter(m => !STANDARD_METALS.some(sm => sm.id === m)).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="__CUSTOM__">+ Custom Metal / Other Alloy...</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Order Mode Toggle in Edit Modal */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                marginBottom: '12px',
                display: 'flex',
                gap: '6px'
              }}>
                <button
                  type="button"
                  onClick={() => setEditForm(prev => {
                    const d = (designs || []).find(x => x.code === prev.designCode);
                    const q = parseInt(prev.qtyAllocated, 10) || 1;
                    const smt = d ? d.totalSMT * q : 480;
                    return { ...prev, isSuite: false, assumedHours: (smt / 60).toFixed(2) };
                  })}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: !editForm.isSuite ? 'linear-gradient(135deg, #d4af37, #b8860b)' : 'transparent',
                    color: !editForm.isSuite ? '#000' : '#94a3b8',
                    fontWeight: 'bold',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>💎</span> Single Design
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm(prev => {
                    const curItems = Array.isArray(prev.items) && prev.items.length > 0 ? prev.items : [
                      { designCode: prev.designCode || 'RNG-SMP-01', qty: parseInt(prev.qtyAllocated, 10) || 1, metalType: prev.metalType || 'Gold 22K', craftingMethod: 'HANDMADE' }
                    ];
                    const smt = curItems.reduce((acc, it) => {
                      const d = (designs || []).find(x => x.code === it.designCode);
                      return acc + ((d ? d.totalSMT : 60) * (parseInt(it.qty, 10) || 1));
                    }, 0);
                    return {
                      ...prev,
                      isSuite: true,
                      suiteName: prev.suiteName || 'Jewellery Suite / Set',
                      items: curItems,
                      assumedHours: (smt / 60).toFixed(2)
                    };
                  })}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: editForm.isSuite ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                    color: editForm.isSuite ? '#000' : '#94a3b8',
                    fontWeight: 'bold',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>👑</span> Multi-Item Suite / Set
                </button>
              </div>

              {!editForm.isSuite ? (
                /* Single Design Edit */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                      Jewellery Design
                    </label>
                    <select 
                      style={{ width: '100%' }}
                      value={editForm.designCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const d = (designs || []).find(x => x.code === code);
                        const q = parseInt(editForm.qtyAllocated, 10) || 1;
                        const smt = d ? d.totalSMT * q : 480;
                        setEditForm({ 
                          ...editForm, 
                          designCode: code,
                          metalType: d && d.metalType ? d.metalType : editForm.metalType,
                          assumedHours: (smt / 60).toFixed(2)
                        });
                      }}
                    >
                      {designs.map(d => (
                        <option key={d.code} value={d.code}>{d.code} — {d.name} ({d.totalSMT}m)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                      Target Qty
                    </label>
                    <input 
                      type="number"
                      min="1"
                      style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}
                      value={editForm.qtyAllocated}
                      onChange={(e) => {
                        const newQ = parseInt(e.target.value, 10) || 1;
                        const d = (designs || []).find(x => x.code === editForm.designCode);
                        const smt = d ? d.totalSMT * newQ : 480;
                        setEditForm({ ...editForm, qtyAllocated: e.target.value, assumedHours: (smt / 60).toFixed(2) });
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Multi-Item Suite Edit Repeater (with Per-Item Manufacturing Route) */
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(180, 83, 9, 0.05) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Crown size={15} color="#fbbf24" />
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24' }}>
                        Edit Suite Pieces & Manufacturing Routes
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextD = designs && designs.length > (editForm.items?.length || 0) ? designs[editForm.items.length] : (designs && designs[0] ? designs[0] : null);
                        setEditForm(prev => {
                          const newItems = [
                            ...(prev.items || []),
                            { designCode: nextD ? nextD.code : 'RNG-SMP-01', qty: 1, metalType: prev.metalType || 'Gold 22K', craftingMethod: nextD?.craftingMethod || 'HANDMADE' }
                          ];
                          const smt = newItems.reduce((acc, it) => {
                            const d = (designs || []).find(x => x.code === it.designCode);
                            return acc + ((d ? d.totalSMT : 60) * (parseInt(it.qty, 10) || 1));
                          }, 0);
                          return { ...prev, items: newItems, assumedHours: (smt / 60).toFixed(2) };
                        });
                      }}
                      style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        color: '#fbbf24',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={11} /> Add Piece
                    </button>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#fef08a' }}
                      value={editForm.suiteName}
                      onChange={(e) => setEditForm({ ...editForm, suiteName: e.target.value })}
                      placeholder="e.g. Royal Bridal Suite (Ring + Necklace + 2x Earrings)"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                    {(editForm.items || []).map((it, idx) => {
                      const d = (designs || []).find(x => x.code === it.designCode);
                      const unitSMT = d ? d.totalSMT : 60;
                      const itemSMT = (unitSMT * (parseInt(it.qty, 10) || 1)).toFixed(1);
                      const itMethod = it.craftingMethod || 'HANDMADE';

                      return (
                        <div 
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr 122px 66px 65px auto',
                            gap: '6px',
                            alignItems: 'center',
                            background: 'rgba(15, 23, 42, 0.6)',
                            padding: '5px 8px',
                            borderRadius: '5px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#fbbf24' }}>#{idx + 1}</span>
                          <select
                            style={{ width: '100%', minWidth: 0, fontSize: '11.5px' }}
                            value={it.designCode}
                            onChange={(e) => {
                              const newCode = e.target.value;
                              const selD = (designs || []).find(ds => ds.code === newCode);
                              setEditForm(prev => {
                                const newItems = prev.items.map((item, i) => i === idx ? {
                                  ...item,
                                  designCode: newCode,
                                  craftingMethod: selD?.craftingMethod || item.craftingMethod || 'HANDMADE'
                                } : item);
                                const smt = newItems.reduce((acc, x) => {
                                  const dItem = (designs || []).find(ds => ds.code === x.designCode);
                                  return acc + ((dItem ? dItem.totalSMT : 60) * (parseInt(x.qty, 10) || 1));
                                }, 0);
                                return { ...prev, items: newItems, assumedHours: (smt / 60).toFixed(2) };
                              });
                            }}
                          >
                            {(designs || []).map(ds => (
                              <option key={ds.code} value={ds.code}>{ds.code} — {ds.name} ({ds.totalSMT}m)</option>
                            ))}
                          </select>

                          <select
                            style={{
                              width: '100%',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              color: itMethod === 'CASTING' ? '#fb923c' : itMethod === 'CNC_LASER' ? '#38bdf8' : '#fbbf24',
                              background: '#0a0f1d'
                            }}
                            value={itMethod}
                            onChange={(e) => {
                              const newM = e.target.value;
                              setEditForm(prev => ({
                                ...prev,
                                items: prev.items.map((item, i) => i === idx ? { ...item, craftingMethod: newM } : item)
                              }));
                            }}
                          >
                            <option value="HANDMADE">🔨 Handmade</option>
                            <option value="CASTING">🔥 Casting</option>
                            <option value="CNC_LASER">⚡ CNC / Laser</option>
                          </select>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <input 
                              type="number"
                              min="1"
                              max="20"
                              value={it.qty}
                              onChange={(e) => {
                                const newQ = parseInt(e.target.value, 10) || 1;
                                setEditForm(prev => {
                                  const newItems = prev.items.map((item, i) => i === idx ? { ...item, qty: newQ } : item);
                                  const smt = newItems.reduce((acc, x) => {
                                    const dItem = (designs || []).find(ds => ds.code === x.designCode);
                                    return acc + ((dItem ? dItem.totalSMT : 60) * (parseInt(x.qty, 10) || 1));
                                  }, 0);
                                  return { ...prev, items: newItems, assumedHours: (smt / 60).toFixed(2) };
                                });
                              }}
                              style={{ width: '44px', fontSize: '11.5px', textAlign: 'center', fontWeight: 'bold' }}
                            />
                            <span style={{ fontSize: '9.5px', color: '#94a3b8' }}>pcs</span>
                          </div>

                          <div style={{ fontSize: '10px', color: '#38bdf8', textAlign: 'right', fontWeight: 'bold' }}>
                            {itemSMT}m
                          </div>

                          <button
                            type="button"
                            disabled={(editForm.items || []).length <= 1}
                            onClick={() => {
                              if ((editForm.items || []).length > 1) {
                                setEditForm(prev => {
                                  const newItems = prev.items.filter((_, i) => i !== idx);
                                  const smt = newItems.reduce((acc, x) => {
                                    const dItem = (designs || []).find(ds => ds.code === x.designCode);
                                    return acc + ((dItem ? dItem.totalSMT : 60) * (parseInt(x.qty, 10) || 1));
                                  }, 0);
                                  return { ...prev, items: newItems, assumedHours: (smt / 60).toFixed(2) };
                                });
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: (editForm.items || []).length <= 1 ? '#475569' : '#f87171',
                              cursor: (editForm.items || []).length <= 1 ? 'not-allowed' : 'pointer',
                              padding: '2px 4px'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#fef08a' }}>
                    <span>Total: {(editForm.items || []).reduce((s, i) => s + (parseInt(i.qty, 10) || 1), 0)} pcs</span>
                    <span>Set SMT: {((editForm.items || []).reduce((acc, it) => {
                      const d = (designs || []).find(x => x.code === it.designCode);
                      return acc + ((d ? d.totalSMT : 60) * (parseInt(it.qty, 10) || 1));
                    }, 0)).toFixed(1)}m</span>
                  </div>
                </div>
              )}

              {/* Hours: Assumed vs Actual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px', background: 'rgba(15, 23, 42, 0.7)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}>
                    Assumed (Budgeted) Hours
                  </label>
                  <input 
                    type="number" 
                    step="any" 
                    required
                    style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#93c5fd' }}
                    value={editForm.assumedHours}
                    onChange={(e) => setEditForm({ ...editForm, assumedHours: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '4px' }}>
                    Actual Hours Taken
                  </label>
                  <input 
                    type="number" 
                    step="any" 
                    placeholder="Leave empty if in progress"
                    style={{ width: '100%', fontSize: '15px', fontWeight: 'bold', color: '#fbbf24' }}
                    value={editForm.actualHours}
                    onChange={(e) => setEditForm({ ...editForm, actualHours: e.target.value })}
                  />
                </div>
              </div>

              {/* Gold Issued and Returned */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Metal Issued (g)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    style={{ width: '100%' }}
                    value={editForm.goldIssuedGrams}
                    onChange={(e) => setEditForm({ ...editForm, goldIssuedGrams: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Metal Returned (g)
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    style={{ width: '100%' }}
                    value={editForm.goldReturnedGrams}
                    onChange={(e) => setEditForm({ ...editForm, goldReturnedGrams: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select 
                    style={{ width: '100%' }}
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Rework">Rework</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="btn-ghost-secondary"
                  style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '6px 12px', fontSize: '12px' }}
                >
                  <Trash2 size={13} />
                  <span>Delete Order</span>
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn-ghost-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-gold-primary">
                    Save Real Values
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Overnight Carry-Over & Safe Vault Transfer Modal */}
      {showCarryModal && carryAlloc && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '660px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #d4af37', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} color="#fef08a" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '19px', fontFamily: 'var(--font-serif)' }}>
                  Overnight Carry-Over & Safe Vault Transfer
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Safely record partial work completed today and carry forward remaining pieces to the next shift
                </span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', padding: '12px 16px', margin: '14px 0', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#cbd5e1' }}>Work Order: <strong style={{ color: '#fff' }}>{carryAlloc.workOrder}</strong></span>
                <span style={{ color: '#cbd5e1' }}>Craftsman: <strong style={{ color: '#fef08a' }}>{carryAlloc.craftsmanId} — {carryAlloc.craftsmanName}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                <span>Design: <strong style={{ color: '#93c5fd' }}>{carryAlloc.designCode} ({carryAlloc.metalType || 'Gold 22K'})</strong></span>
                <span>Budgeted: <strong>{carryAlloc.assumedHours || (carryAlloc.budgetedSMT / 60).toFixed(1)} hrs</strong> ({carryAlloc.qtyAllocated} pcs)</span>
              </div>
            </div>

            <form onSubmit={handleConfirmCarryOver}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🌙 1. Today's Shift Log ({carryAlloc.date})</span>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '3px' }}>
                      Actual Hours Spent Today:
                    </label>
                    <input 
                      type="number" 
                      step="any" 
                      required
                      style={{ width: '100%', fontWeight: 'bold', color: '#fbbf24' }}
                      value={carryTodayHours} 
                      onChange={(e) => setCarryTodayHours(e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '3px' }}>
                      Pieces Completed Today:
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max={carryAlloc.qtyAllocated}
                      style={{ width: '100%' }}
                      value={carryTodayCompletedQty} 
                      onChange={(e) => setCarryTodayCompletedQty(parseInt(e.target.value, 10) || 0)} 
                    />
                  </div>
                </div>

                <div style={{ background: '#0a0f1d', padding: '12px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>☀️ 2. Tomorrow's Continuation Ticket</span>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '3px' }}>
                      Next Working Shift Date:
                    </label>
                    <input 
                      type="date" 
                      required
                      style={{ width: '100%', fontWeight: 'bold', color: '#38bdf8' }}
                      value={carryNextDate} 
                      onChange={(e) => setCarryNextDate(e.target.value)} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginBottom: '3px' }}>
                      Estimated Remaining Hours:
                    </label>
                    <input 
                      type="number" 
                      step="any" 
                      required
                      style={{ width: '100%', fontWeight: 'bold', color: '#93c5fd' }}
                      value={carryRemainingHours} 
                      onChange={(e) => setCarryRemainingHours(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#fef08a', marginBottom: '6px' }}>
                  <ShieldCheck size={14} color="#d4af37" />
                  <span>Overnight Safe Vault Check-In (Metal Security):</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                      Semi-Finished Piece + Raw Metal in Safe (g):
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      style={{ width: '100%', fontWeight: 'bold', color: '#fef08a' }}
                      placeholder="e.g. 35.80g"
                      value={carryVaultGrams}
                      onChange={(e) => setCarryVaultGrams(e.target.value)}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                    Raw precious metal cannot remain on open benches overnight. Enter total metal grams checked into the safe vault.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-ghost-secondary" onClick={() => setShowCarryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} />
                  <span>Transfer to Safe & Carry Forward</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: External Partner Jewellers Directory & Registration Modal */}
      {showShopsModal && (
        <div className="modal-backdrop-luxury">
          <div className="modal-window-luxury" style={{ maxWidth: '850px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Store size={14} />
                  <span>B2B SUBCONTRACT PARTNER NETWORK</span>
                </div>
                <h2 style={{ fontSize: '20px', color: '#fff', margin: '4px 0 0 0', fontFamily: 'var(--font-serif)' }}>
                  External Client Jeweller Shops Directory
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  Register and manage external retail jeweller shops who place manufacturing orders with Ashadi Jewellers.
                </p>
              </div>

              <button 
                type="button" 
                onClick={() => setShowShopsModal(false)}
                className="btn-ghost-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#bae6fd', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={15} color="#38bdf8" />
                  <span>Register New External Client Shop (B2B Partner)</span>
                </h4>

                <form onSubmit={handleCreateFullShop}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '3px' }}>
                        Shop Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Devi Jewellers"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newShopForm.name}
                        onChange={(e) => setNewShopForm({ ...newShopForm, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '3px' }}>
                        Location / Street
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sea Street, Colombo 11"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newShopForm.location}
                        onChange={(e) => setNewShopForm({ ...newShopForm, location: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '3px' }}>
                        Contact Person
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Mr. R. Devi"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newShopForm.contactPerson}
                        onChange={(e) => setNewShopForm({ ...newShopForm, contactPerson: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '3px' }}>
                        Phone Number
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. +94 11 233 1188"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newShopForm.phone}
                        onChange={(e) => setNewShopForm({ ...newShopForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '10px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#fef08a', marginBottom: '3px' }}>
                        Agreed Scrap Ceiling (%)
                      </label>
                      <input 
                        type="number" 
                        step="any" 
                        required
                        placeholder="3.5"
                        style={{ width: '100%', fontSize: '12px', fontWeight: 'bold', color: '#fef08a' }}
                        value={newShopForm.agreedLossPct}
                        onChange={(e) => setNewShopForm({ ...newShopForm, agreedLossPct: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '3px' }}>
                        Contract Notes / Billing Model
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Contract SMT piece-rate + 3.5% gold wastage limit"
                        style={{ width: '100%', fontSize: '12px' }}
                        value={newShopForm.billingModel}
                        onChange={(e) => setNewShopForm({ ...newShopForm, billingModel: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-gold-primary"
                      style={{ fontSize: '12px', padding: '8px 16px', height: '36px', whiteSpace: 'nowrap' }}
                      disabled={isSubmittingShop}
                    >
                      <Plus size={14} />
                      <span>{isSubmittingShop ? 'Registering...' : 'Register Shop'}</span>
                    </button>
                  </div>
                </form>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Registered External Client Shops ({clientShops.length}):</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Click on any shop name when dispatching work orders
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {clientShops.map((shop) => (
                  <div key={shop.id} style={{ background: '#0a0f1d', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <strong style={{ color: '#fef08a', fontSize: '14px' }}>{shop.name}</strong>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{shop.location}</div>
                      </div>
                      <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                        {shop.id}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '8px' }}>
                      {shop.contactPerson && <div>👤 Contact: <strong>{shop.contactPerson}</strong></div>}
                      {shop.phone && <div>📞 Phone: <strong>{shop.phone}</strong></div>}
                      <div style={{ marginTop: '2px' }}>
                        ⚖️ Scrap Allowance: <strong style={{ color: '#34d399' }}>{shop.agreedLossPct}% Max Loss</strong>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <span>Orders: <strong style={{ color: '#fff' }}>{shop.ordersCount || 0}</strong></span>
                      <span>Pieces: <strong style={{ color: '#fff' }}>{shop.piecesCount || 0} pcs</strong></span>
                      <span>Scrap: <strong style={{ color: (shop.avgScrapLossPct || 0) > shop.agreedLossPct ? '#f87171' : '#34d399' }}>{shop.avgScrapLossPct ? `${shop.avgScrapLossPct}%` : '—'}</strong></span>
                    </div>

                    {onDeleteClientShop && (
                      <div style={{ marginTop: '10px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${shop.name} from the external shops directory?`)) {
                              onDeleteClientShop(shop.id);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '11px', cursor: 'pointer', padding: '2px 6px' }}
                          title="Remove shop from registry"
                        >
                          Remove Shop
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fast 63-Bench Batch Worksheet Modal */}
      {showBatchModal && (
        <DailyBatchWorksheetModal
          craftsmen={craftsmen}
          designs={designs}
          leaves={leaves}
          allocations={allocations}
          clientShops={clientShops}
          onClose={() => setShowBatchModal(false)}
          onSuccess={() => {
            if (onAddAllocation) onAddAllocation(null);
          }}
        />
      )}

      {/* Batch 4-per-A4 Print Modal */}
      {showBatchPrintModal && (
        <BatchPrintSlipsModal
          isOpen={showBatchPrintModal}
          onClose={() => setShowBatchPrintModal(false)}
          allocations={filteredAllocations && filteredAllocations.length > 0 ? filteredAllocations : allocations}
          selectedDate={monthFilter !== 'ALL' ? monthFilter : 'Selected Period'}
          designs={designs}
        />
      )}

      {/* Visual Jewellery Design Selector Popup */}
      {visualPickerState && visualPickerState.isOpen && (
        <VisualDesignPickerModal
          isOpen={visualPickerState.isOpen}
          onClose={() => setVisualPickerState(null)}
          onSelect={handleSelectDesignFromVisualPicker}
          designs={designs}
          craftsman={visualPickerState.craftsman}
          currentDesignCode={visualPickerState.currentDesignCode}
        />
      )}
    </div>
  );
}
