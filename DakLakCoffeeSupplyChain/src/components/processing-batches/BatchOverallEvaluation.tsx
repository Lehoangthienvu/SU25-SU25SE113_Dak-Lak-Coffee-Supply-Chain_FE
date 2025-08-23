"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Info, Trophy, Target } from 'lucide-react';

interface StageEvaluation {
  stageCode: number; // Thay đổi từ string sang number để match với ProcessingStage
  evaluationResult: string;
  score: number;
  evaluatedAt?: string;
}

interface ProcessingStage {
  stageId: number; // Thay đổi từ string sang number để match với backend
  stageName: string;
  orderIndex: number;
  stageCode?: string;
}

interface BatchOverallEvaluationProps {
  batchId: string;
  evaluations: StageEvaluation[];
  stages: ProcessingStage[];
}

export default function BatchOverallEvaluation({ batchId, evaluations, stages }: BatchOverallEvaluationProps) {
  const [overallResult, setOverallResult] = useState<string>('Pending');
  const [overallScore, setOverallScore] = useState<number>(0);
  const [passedStages, setPassedStages] = useState<number>(0);
  const [totalStages, setTotalStages] = useState<number>(0);

  const availableStages = stages || [];

  useEffect(() => {
    calculateOverallEvaluation();
  }, [evaluations, availableStages]);

  const calculateOverallEvaluation = () => {
    setTotalStages(availableStages.length);
    
    if (!evaluations || evaluations.length === 0) {
      setOverallResult('Pending');
      setOverallScore(0);
      setPassedStages(0);
      return;
    }

    let totalScore = 0;
    let totalWeight = 0;
    let passedCount = 0;

    evaluations.forEach(evaluation => {
      const weight = 1;
      totalWeight += weight;
      
      if (evaluation.evaluationResult === 'Pass') {
        totalScore += weight * 100;
        passedCount++;
      } else if (evaluation.evaluationResult === 'NeedsImprovement') {
        totalScore += weight * 70;
      } else if (evaluation.evaluationResult === 'Fail') {
        totalScore += weight * 0;
      }
    });

    const averageScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    setOverallScore(averageScore);
    setPassedStages(passedCount);

    const minPassStages = Math.ceil(availableStages.length * 0.67);
    const minImprovementStages = Math.ceil(availableStages.length * 0.5);
    
    if (averageScore >= 80 || passedCount >= minPassStages) {
      setOverallResult('Pass');
    } else if (averageScore >= 60 || passedCount >= minImprovementStages) {
      setOverallResult('NeedsImprovement');
    } else {
      setOverallResult('Fail');
    }
  };

  const getStageStatus = (stageId: string) => {
    const evaluation = evaluations.find(e => e.stageCode.toString() === stageId);
    
    // Nếu có evaluation cho stage này, trả về kết quả
    if (evaluation) {
      return evaluation.evaluationResult;
    }
    
    // Nếu không có evaluation nhưng overall result là Pass, hiển thị "Pass" cho tất cả stages
    if (overallResult === 'Pass') {
      return 'Pass';
    }
    
    // Nếu không có evaluation và overall result không phải Pass, hiển thị "Pending"
    return 'Pending';
  };

  const getOverallResultColor = () => {
    switch (overallResult) {
      case 'Pass': return 'bg-green-100 text-green-800 border-green-200';
      case 'NeedsImprovement': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Fail': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverallResultIcon = () => {
    switch (overallResult) {
      case 'Pass': return <Trophy className="h-5 w-5" />;
      case 'NeedsImprovement': return <AlertTriangle className="h-5 w-5" />;
      case 'Fail': return <XCircle className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          Tổng quan đánh giá lô
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Thống kê tổng quan - làm nhỏ lại */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Kết quả tổng hợp */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getOverallResultColor()}`}>
              <div className="p-1 bg-white/50 rounded">
                {getOverallResultIcon()}
              </div>
              <span className="font-medium text-sm">
                {overallResult === 'Pass' ? 'Đạt' :
                 overallResult === 'NeedsImprovement' ? 'Cần cải thiện' :
                 overallResult === 'Fail' ? 'Không đạt' : 'Chưa đánh giá'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Kết quả</p>
          </div>

          {/* Điểm trung bình */}
          <div className="text-center">
            <div className="bg-blue-500 text-white p-3 rounded-lg">
              <div className="text-2xl font-bold">
                {overallScore.toFixed(1)}
              </div>
              <div className="text-sm opacity-90">/100</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-400 h-2 rounded-full" 
                style={{ width: `${overallScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Điểm TB</p>
          </div>

          {/* Giai đoạn đạt chuẩn */}
          <div className="text-center">
            <div className="bg-green-500 text-white p-3 rounded-lg">
              <div className="text-2xl font-bold">
                {passedStages}
              </div>
              <div className="text-sm opacity-90">/{totalStages}</div>
            </div>
            <p className="text-xs text-gray-600 mt-1">Giai đoạn đạt</p>
          </div>
        </div>

        {/* Logic đánh giá - làm nhỏ lại */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 text-center">
          <div className="text-xs text-blue-800">
            <span className="font-medium">Logic:</span> Đạt ≥80đ HOẶC ≥{Math.ceil(availableStages.length * 0.67)}/{availableStages.length} giai đoạn
          </div>
        </div>

        {/* Chi tiết từng giai đoạn - di chuyển lên trên và làm nhỏ lại */}
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Chi tiết từng giai đoạn
          </h4>
          
          {availableStages.length > 0 ? (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {availableStages.map((stage) => {
                const status = getStageStatus(stage.stageId.toString());
                const evaluation = evaluations.find(e => e.stageCode.toString() === stage.stageId.toString());
                
                return (
                  <div key={stage.stageId} className="text-center">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 hover:bg-gray-100 transition-colors">
                      <div className="text-xs font-medium text-gray-700 mb-1 truncate" title={stage.stageName}>
                        {stage.stageName}
                      </div>
                      
                      <Badge variant={
                        status === 'Pass' ? "default" :
                        status === 'NeedsImprovement' ? "secondary" :
                        status === 'Fail' ? "destructive" : "outline"
                      } className="text-xs px-2 py-0.5 rounded-full font-medium mb-1">
                        {status === 'Pass' ? '✅' :
                         status === 'NeedsImprovement' ? '⚠️' :
                         status === 'Fail' ? '❌' : '⏳'}
                      </Badge>
                      
                      {evaluation && (
                        <div className="text-xs text-gray-500 font-medium">
                          {evaluation.score}/100
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <Info className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Chưa có thông tin giai đoạn</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
